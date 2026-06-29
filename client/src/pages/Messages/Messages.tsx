import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { Conversation, Message } from "../../types";
import { getMyConversations } from "../../services/conversations";
import {
  getMessages,
  sendMessage,
  markAsRead,
} from "../../services/messages";
import { getSocket } from "../../services/socket";
import { getErrorMessage } from "../../services/error";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast/ToastContext";
import Button from "../../components/ui/Button/Button";
import Spinner from "../../components/ui/Spinner/Spinner";
import EmptyState from "../../components/ui/EmptyState/EmptyState";
import {
  MessageIcon,
  SendIcon,
  ChevronLeftIcon,
  UserIcon,
} from "../../components/ui/icons";
import { formatRelativeTime } from "../../utils/format";
import "./Messages.css";

const MAX_LEN = 500;

// Wall-clock time for a message bubble, e.g. "5:04 PM" (locale-adaptive).
function msgClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Append a message only if it isn't already present (dedupes the sender's own
// POST-response message against the socket "newMessage" echo, same server id).
function appendUnique(list: Message[], msg: Message): Message[] {
  return list.some((m) => m.id === msg.id) ? list : [...list, msg];
}

function Messages() {
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const me = user?.id ?? null;
  const isOwner = user?.role === "owner";

  // Optional deep-link target from a "Message" button (router state). For a
  // brand-new conversation (no messages yet) it isn't in the inbox list, so the
  // peer's username is carried along to label the header/greeting.
  const navState = location.state as
    | { conversationId?: number; peerName?: string }
    | null;
  const initialId = navState?.conversationId ?? null;
  const initialPeerName = navState?.peerName ?? null;

  // Inbox
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Active thread
  const [activeId, setActiveId] = useState<number | null>(initialId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(initialId !== null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadReloadKey, setThreadReloadKey] = useState(0);

  // Composer
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  // Latest-value refs read inside socket listeners (avoid stale closures).
  const meRef = useRef<number | null>(me);
  const activeIdRef = useRef<number | null>(activeId);
  const conversationsRef = useRef<Conversation[]>(conversations);
  const joinedRef = useRef<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Mirror the latest values into refs so the once-mounted socket listeners
  // read current state instead of stale closures.
  useEffect(() => {
    meRef.current = me;
    activeIdRef.current = activeId;
    conversationsRef.current = conversations;
  });

  // Load the inbox.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMyConversations();
        if (!active) return;
        setConversations(data);
        setLoadError(null);
      } catch (err) {
        if (active)
          setLoadError(getErrorMessage(err, "Couldn't load your messages."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Load the active thread, join its room, and mark it read.
  useEffect(() => {
    if (activeId === null) return;
    let active = true;
    const socket = getSocket();
    socket.emit("joinConversation", activeId);
    (async () => {
      try {
        const data = await getMessages(activeId);
        if (!active) return;
        // A socket "newMessage" may have arrived while the history loaded —
        // keep it instead of clobbering it with the fetched page.
        setMessages((prev) => {
          const ids = new Set(data.map((m) => m.id));
          return [...data, ...prev.filter((m) => !ids.has(m.id))];
        });
        setThreadError(null);
        markAsRead(activeId).catch(() => {});
        // clear this conversation's unread dot locally
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId && c.messages?.[0]
              ? { ...c, messages: [{ ...c.messages[0], read: true }] }
              : c,
          ),
        );
      } catch (err) {
        if (active)
          setThreadError(
            getErrorMessage(err, "Couldn't load this conversation."),
          );
      } finally {
        if (active) setThreadLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeId, threadReloadKey]);

  // Realtime: one "newMessage" listener for the whole page (+ reconnect re-join).
  // Mounted once; reads refs so it always sees the current thread/user.
  useEffect(() => {
    const socket = getSocket();

    const onNewMessage = (msg: Message) => {
      const isActive = msg.conversationId === activeIdRef.current;
      if (isActive) {
        setMessages((prev) => appendUnique(prev, msg));
        if (msg.senderId !== meRef.current)
          markAsRead(msg.conversationId).catch(() => {});
      }
      // Update inbox preview / order / unread for any known conversation.
      setConversations((prev) =>
        prev.some((c) => c.id === msg.conversationId)
          ? prev.map((c) =>
              c.id === msg.conversationId
                ? {
                    ...c,
                    messages: [
                      isActive && msg.senderId !== meRef.current
                        ? { ...msg, read: true }
                        : msg,
                    ],
                  }
                : c,
            )
          : prev,
      );
    };

    // After a reconnect the server-side room membership is gone — re-join all.
    const onConnect = () => {
      joinedRef.current.clear();
      for (const c of conversationsRef.current) {
        socket.emit("joinConversation", c.id);
        joinedRef.current.add(c.id);
      }
      if (activeIdRef.current !== null)
        socket.emit("joinConversation", activeIdRef.current);
    };

    socket.on("newMessage", onNewMessage);
    socket.on("connect", onConnect);
    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("connect", onConnect);
    };
  }, []);

  // Join every conversation's room once, so the inbox updates live even for
  // threads that aren't open. Joins are idempotent server-side.
  useEffect(() => {
    const socket = getSocket();
    for (const c of conversations) {
      if (!joinedRef.current.has(c.id)) {
        socket.emit("joinConversation", c.id);
        joinedRef.current.add(c.id);
      }
    }
  }, [conversations]);

  // Keep the thread pinned to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activeId]);

  function retryInbox() {
    setLoading(true);
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }

  function retryThread() {
    setThreadLoading(true);
    setThreadError(null);
    setThreadReloadKey((k) => k + 1);
  }

  function openConversation(id: number) {
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    setThreadError(null);
    setThreadLoading(true);
    setDraft(""); // composer state is per-thread; don't carry it across
    setSending(false);
  }

  function closeThread() {
    setActiveId(null);
    setMessages([]);
    setThreadError(null);
    setDraft("");
    setSending(false);
  }

  async function handleSend() {
    const targetId = activeId;
    const content = draft;
    if (!content.trim() || targetId === null || sending) return;
    if (content.length > MAX_LEN) {
      toast.error(`Message is too long (max ${MAX_LEN} characters).`);
      return;
    }
    setSending(true);
    try {
      const msg = await sendMessage(targetId, content);
      // The user may have switched threads while the request was in flight —
      // only touch the open thread/composer if we're still on the target.
      if (activeIdRef.current === targetId) {
        setMessages((prev) => appendUnique(prev, msg));
        setDraft("");
      }
      if (!conversationsRef.current.some((c) => c.id === targetId)) {
        // First message in a deep-linked conversation: it isn't in the inbox
        // yet (the backend hides message-less conversations) — pull it in.
        setReloadKey((k) => k + 1);
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, messages: [msg] } : c)),
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't send your message."));
    } finally {
      setSending(false);
    }
  }

  // The other participant of a conversation (organizer sees owner, vice versa).
  function otherName(c: Conversation): string {
    const other = isOwner ? c.organizer : c.owner;
    return other?.username ?? "Unknown user";
  }

  // Inbox sorted by most recent activity (backend returns creation order).
  const sortedConversations = useMemo(() => {
    const lastAt = (c: Conversation) =>
      new Date(c.messages?.[0]?.createdAt ?? c.createdAt).getTime();
    return [...conversations].sort((a, b) => lastAt(b) - lastAt(a));
  }, [conversations]);

  const activeConversation =
    activeId !== null
      ? conversations.find((c) => c.id === activeId) ?? null
      : null;

  // Name of the other party in the open thread. Falls back to the deep-linked
  // peer name when the conversation isn't in the inbox yet (no messages).
  const peerName = activeConversation
    ? otherName(activeConversation)
    : initialPeerName;

  return (
    <div className="messages-page">
      <div className={`chat ${activeId !== null ? "is-thread-open" : ""}`}>
        {/* ---- Inbox ---- */}
        <aside className="chat-list" aria-label="Conversations">
          {loading && <Spinner label="Loading conversations…" />}

          {!loading && loadError && (
            <EmptyState
              icon={<MessageIcon size={26} />}
              title="Something went wrong"
              message={loadError}
              action={
                <Button variant="secondary" onClick={retryInbox}>
                  Try again
                </Button>
              }
            />
          )}

          {!loading && !loadError && conversations.length === 0 && (
            <EmptyState
              icon={<MessageIcon size={26} />}
              title="No conversations yet"
              message="Message a stadium owner from Browse, or wait for an organizer to reach out."
            />
          )}

          {!loading && !loadError && conversations.length > 0 && (
            <ul className="conv-list">
              {sortedConversations.map((c) => {
                const last = c.messages?.[0];
                const unread = !!last && !last.read && last.senderId !== me;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`conv-item ${c.id === activeId ? "is-active" : ""}`}
                      onClick={() => openConversation(c.id)}
                      aria-current={c.id === activeId}
                    >
                      <span className="conv-avatar" aria-hidden="true">
                        <UserIcon size={20} />
                      </span>
                      <span className="conv-body">
                        <span className="conv-top">
                          <span className="conv-name">{otherName(c)}</span>
                          {last && (
                            <span className="conv-time">
                              {formatRelativeTime(last.createdAt)}
                            </span>
                          )}
                        </span>
                        <span className="conv-preview-row">
                          <span className={`conv-preview ${unread ? "is-unread" : ""}`}>
                            {last ? last.content : "No messages yet"}
                          </span>
                          {unread && (
                            <span
                              className="conv-dot"
                              role="img"
                              aria-label="Unread"
                            />
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ---- Thread ---- */}
        <section className="chat-thread" aria-label="Conversation">
          {activeId === null ? (
            <div className="thread-placeholder">
              <MessageIcon size={32} />
              <p>Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <header className="thread-header">
                <button
                  type="button"
                  className="thread-back"
                  onClick={closeThread}
                  aria-label="Back to conversations"
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <span className="thread-avatar" aria-hidden="true">
                  <UserIcon size={18} />
                </span>
                <span className="thread-name">
                  {peerName ?? "Conversation"}
                </span>
              </header>

              {threadLoading && <Spinner label="Loading messages…" />}

              {!threadLoading && threadError && (
                <EmptyState
                  icon={<MessageIcon size={26} />}
                  title="Couldn't load messages"
                  message={threadError}
                  action={
                    <Button variant="secondary" onClick={retryThread}>
                      Try again
                    </Button>
                  }
                />
              )}

              {!threadLoading && !threadError && (
                <>
                  <div className="chat-messages">
                    {messages.length === 0 ? (
                      <p className="thread-empty">
                        {peerName
                          ? `No messages yet — say hello to ${peerName}!`
                          : "No messages yet — say hello!"}
                      </p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className={`bubble-row ${m.senderId === me ? "mine" : "theirs"}`}
                        >
                          <div className="bubble">
                            <span className="bubble-text">{m.content}</span>
                            <span className="bubble-time">
                              {msgClock(m.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <form
                    className="chat-composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                  >
                    <textarea
                      className="chat-input"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message…"
                      rows={1}
                      maxLength={MAX_LEN}
                      aria-label="Message"
                    />
                    <Button
                      type="submit"
                      iconLeft={<SendIcon size={18} />}
                      loading={sending}
                      disabled={!draft.trim()}
                    >
                      Send
                    </Button>
                  </form>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Messages;
