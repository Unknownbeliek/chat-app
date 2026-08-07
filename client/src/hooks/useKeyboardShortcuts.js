import { useEffect } from 'react';

export default function useKeyboardShortcuts({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  selectedUser,
  setSelectedUser,
  registeredUsers = [],
  historicalChats = [],
  chatHistory = {},
  showShortcutsHelp,
  setShowShortcutsHelp,
  callState,
  toggleMute,
  toggleVideo,
  setShowEmojiPicker,
  onSendMessage
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is inside editable inputs/textareas for single key shortcuts like '?'
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target?.tagName) || e.target?.isContentEditable;

      // 1. Ctrl + K: Focus sidebar search bar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // 2. Ctrl + /: Focus chat message input and insert /
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const messageInput = document.querySelector('input[placeholder*="Message"], textarea');
        if (messageInput) {
          messageInput.focus();
          if (!messageInput.value.startsWith('/')) {
            const event = new Event('input', { bubbles: true });
            messageInput.value = '/' + messageInput.value;
            messageInput.dispatchEvent(event);
          }
        }
        return;
      }

      // 3. Ctrl + Enter: Send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const sendBtn = document.querySelector('button[type="submit"], button[title*="Send"]');
        if (sendBtn) {
          sendBtn.click();
        }
        return;
      }

      // 4. Escape: Close modals / clear search
      if (e.key === 'Escape') {
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          return;
        }
      }

      // 5. Ctrl + Shift + M: Toggle mic mute in active call
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (toggleMute) toggleMute();
        return;
      }

      // 6. Ctrl + Shift + V: Toggle video camera in active call
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (toggleVideo) toggleVideo();
        return;
      }

      // 7. Ctrl + Shift + E: Toggle emoji picker
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (setShowEmojiPicker) {
          setShowEmojiPicker(prev => !prev);
        }
        return;
      }

      // 8. Ctrl + Shift + N: Start new chat (switch to Contacts & focus search)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (setActiveTab) setActiveTab('contacts');
        setTimeout(() => {
          const searchInput = document.querySelector('input[placeholder*="Search"]');
          if (searchInput) searchInput.focus();
        }, 50);
        return;
      }

      // 9. Alt + Up / Down: Navigate conversations in sidebar
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const contacts = Array.from(document.querySelectorAll('button[class*="w-full text-left"]'));
        if (contacts.length === 0) return;

        const currentIndex = contacts.findIndex(c => c.getAttribute('aria-selected') === 'true' || c.className.includes('bg-indigo-600'));
        let nextIndex = 0;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex >= 0 ? (currentIndex + 1) % contacts.length : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : contacts.length - 1;
        }

        if (contacts[nextIndex]) {
          contacts[nextIndex].click();
        }
        return;
      }

      // 10. ? (Shift + / when not in input field): Open Shortcuts Help Modal
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        if (setShowShortcutsHelp) {
          setShowShortcutsHelp(prev => !prev);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedUser,
    setSelectedUser,
    showShortcutsHelp,
    setShowShortcutsHelp,
    toggleMute,
    toggleVideo,
    setShowEmojiPicker
  ]);
}
