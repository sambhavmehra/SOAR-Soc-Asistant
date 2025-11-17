# TODO: Add Topic Assignment to Security Chatbot

## Tasks
- [x] Update conversation object structure to include `topic` field
- [x] Add predefined security topics list (e.g., Malware, Phishing, Network Security, etc.)
- [x] Modify `handleNewConversation` in `src/pages/security-chatbot/index.jsx` to include topic selection
- [x] Add topic selection UI (dropdown/input) in new conversation flow
- [ ] Enhance `generateConversationTitle` to optionally suggest AI-generated topics
- [x] Update `ConversationSidebar.jsx` to display topic in conversation cards
- [ ] Add topic editing functionality (right-click menu or edit button)
- [x] Ensure topic persistence in localStorage
- [ ] Test manual topic assignment with various security scenarios
- [ ] Test automatic topic suggestion (if implemented)
- [ ] Verify UI updates and no regressions in conversation management

## Completed Features
- ✅ Created `NewConversationModal.jsx` component with topic selection dropdown
- ✅ Updated conversation creation flow to include manual topic assignment
- ✅ Added topic display in conversation sidebar with accent color
- ✅ Updated mock conversations to include topic field
- ✅ Ensured topic persistence in localStorage alongside conversations

## Remaining Work
- Implement AI-powered topic suggestions in conversation title generation
- Add inline topic editing functionality in conversation sidebar
- Comprehensive testing of topic assignment and UI interactions
- Verify conversation management doesn't have regressions

## Notes
- Topics should be security-focused categories
- Allow both manual assignment and optional AI suggestions
- Default topic: "General Security" if none selected
- Topics should be editable after conversation creation
