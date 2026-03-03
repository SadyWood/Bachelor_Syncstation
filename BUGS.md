# Bug Hunt List

Tracked bugs to fix

---

## Frontend — Login

- [ ] **Keyboard hides input fields on login screen.**
  The keyboard on mobile covers the email/password fields so the user can't see what they're typing.
  Fix: Wrap the login form in `KeyboardAvoidingView` (or `KeyboardAwareScrollView`) so fields scroll into view when the keyboard opens.

- [ ] **Login flow has two separate pages (sign in + login).**
  There's a welcome/sign-in screen and a separate login screen. Could be simplified to one screen that shows the login fields directly, removing the extra tap.

## Frontend — Design Consistency

- [ ] **Settings page styling doesn't match the rest of the app.**
  Buttons on settings have more rounded corners than the main page cards, breaking visual cohesion. Categories (Data & Storage, Privacy, etc.) should use the same white card/box style as the Home screen (Active Scene, Current Context) and buttons should be allocated to these cards. This would also eliminate the yellow background gaps between buttons.
