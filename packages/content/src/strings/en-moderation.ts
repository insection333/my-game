// The admin page (session 9) and bad actors (session 39): finding and acting on a player, reporting a
// player from Hiscores or Castle Clash, and the admin's queue of reports and sieges between lords. Part of
// the strings file (en.ts).
export const moderation = {
  'admin.title': 'Admin',
  'admin.players': 'Players',
  'admin.search': 'Player name',
  'admin.find': 'Find',
  'admin.none': 'No player by that name.',
  'admin.joined': 'Joined {date}',
  'admin.totalLevel': 'Total level {level}',
  'admin.banned': 'Banned',
  'admin.open': 'Open',
  'admin.newName': 'Name',
  'admin.rename': 'Rename',
  'admin.ban': 'Ban',
  'admin.unban': 'Unban',
  'admin.mend': 'Check and mend save',
  'admin.reset': 'Set a new password',
  'admin.newPassword':
    'Their new password. Pass it on; it replaces the old one, they are signed out everywhere, and they can change it in Settings:',
  'admin.repairs': 'Repairs to this save',
  'admin.noRepairs': 'None: the save has always read cleanly.',
  'admin.save': 'The save',

  'report.title': 'Report this player',
  'report.name': 'Offensive name',
  'report.cheating': 'Cheating or abuse',
  'report.sent': 'Reported. An admin will look into it.',
  'report.failed': 'That report did not go through. Try again in a while.',

  'admin.reports': 'Reports',
  'admin.reports.none': 'Nothing reported.',
  'admin.reports.forName': 'For the name: {count}',
  'admin.reports.forCheating': 'For cheating or abuse: {count}',
  'admin.reports.by': 'Reporters: {count}, of them playing a while: {listed}',
  'admin.reports.when': 'Last {date}',
  'admin.reports.dismiss': 'Dismiss',
  'admin.flows': 'Sieges between lords',
  'admin.flows.lead':
    'Pairs with four or more sieges in 30 days, most gold first. Gold going one way may be an account feeding another.',
  'admin.flows.none': 'No pair of lords has met that often.',
  'admin.flows.pair': '{attacker} on {defender}',
  'admin.flows.facts': '{sieges} sieges, {breaches} breached, {gold} gold taken; {back} the other way',
  // Letters (session 45): what an admin's warning says.
  'mail.warning':
    'Messages that insult, harass or try to get past the language filter are not allowed. Send any more like that and you will lose the right to send messages.',
};
