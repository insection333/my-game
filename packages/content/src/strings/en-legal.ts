// The privacy page and the terms of use, in plain words. Each page's body is its sections in order,
// separated by blank lines: a heading on the first line of each, then its paragraph.

export const legal: Record<string, string> = {
  'legal.contact': 'Contact: {address}',
  'legal.privacy.title': 'Privacy',
  'legal.privacy.updated': 'Last changed 26 October 2026',
  'legal.privacy.body': [
    'What we keep\nYour player name, your password (only as a one-way hash, never the password itself), your game save, the notices in your tray and your place on the hiscores. We do not ask for your real name, your email address or your age, beyond your word that you are 13 or older.',
    'How it is used\nTo run your game: your lanes keep working while you are away because your save is kept on our server. Your player name and levels are shown to other players on the hiscores.',
    'Game statistics\nWe count what happens in the game (levels, finds, why a lane stopped, when people sign in) to make it better. These counts hold an anonymous player number, never your name, your address or anything you typed.',
    'One cookie\nA single cookie keeps you signed in for 30 days. There are no advertising or tracking cookies, and nothing is shared with other companies.',
    'Your address on the internet\nYour connection address is used for a short while to stop people guessing passwords or flooding sign-ups. It is not stored with your account.',
    'Deleting your account\nYou can delete your account from Settings at any time. Everything we hold about you goes at once: your account, your save, your notices, your hiscores and your game statistics.',
    'Questions\nWrite to admin@idleclash.com.',
  ].join('\n\n'),
  'legal.terms.title': 'Terms of use',
  'legal.terms.updated': 'Last changed 26 October 2026',
  'legal.terms.body': [
    'Who can play\nYou must be 13 or older to make an account. One account per person.',
    'Your name\nChoose a name others will be glad to see on the hiscores. We may rename an account whose name is offensive, or that passes for the game or its team.',
    'Play fair\nPlay with your own hands: no scripts or programs that play for you, no exploiting bugs (tell us instead), and no attempts to break or overload the game. Accounts that do may be banned.',
    'The game changes\nThe game is being built and will change: numbers are balanced, things are added, and now and then something breaks. Nothing in the game has money value, and there is nothing to buy.',
    'Your account\nKeep your password to yourself. If you forget it, write to admin@idleclash.com with your player name and an admin can help you set a new one. You can delete your account from Settings whenever you like.',
    'As it is\nThe game is offered as it is, without promises that it will always be available or free of mistakes. We do our best to keep your save safe.',
  ].join('\n\n'),
};
