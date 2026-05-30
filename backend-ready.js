// Backend ready guide
// Abhi app localStorage me har username ke hisaab se alag data save karta hai.
// Backend connect karne ke liye in functions ko API / Supabase / Firebase se replace karein:
// registerAccount -> users table me username create
// loginAccount -> users table se username/password verify
// saveRaw -> currentUser ke data ko database me save
// loadData -> currentUser ke data ko database se load
// Suggested DB shape:
// users/{username}: { username, passwordHash, createdAt }
// stores/{username}: { profile, products, purchases, sales }
