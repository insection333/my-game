// Every player-facing word in the game. Templates take {named} parameters, always already formatted
// (see numbers.ts). The content check fails on a missing key, an unused key, or a term GLOSSARY.md
// says to avoid. Keep sections in order; within a feature's section, keys follow its content. The gathering
// and artisan skills' words are in en-skills.ts, Combat's in en-combat.ts, the privacy page's and the
// terms' in en-legal.ts, Fishing's and Cooking's in en-food.ts, Fletching's, Runecraft's and the supplies' in en-supplies.ts, the goals ladder's, its rewards' and your standing's in en-progress.ts, Kindling's in en-kindling.ts, the seasons' in en-seasons.ts, year two's deeds and honours in en-year-two.ts, notices while away in en-push.ts, the Storehouse's and the vendor's in en-store.ts, the lanes' in en-lanes.ts, the steading's in en-steading.ts, the closed test's in en-test.ts, the admin page's and reporting's in en-moderation.ts.
import { combat } from './en-combat.ts';
import { deeds } from './en-deeds.ts';
import { honours } from './en-honours.ts';
import { companions } from './en-companions.ts';
import { expeditions } from './en-expeditions.ts';
import { food } from './en-food.ts';
import { kindling } from './en-kindling.ts';
import { seasons } from './en-seasons.ts';
import { yearTwo } from './en-year-two.ts';
import { push } from './en-push.ts';
import { store } from './en-store.ts';
import { lanes } from './en-lanes.ts';
import { castle } from './en-castle.ts';
import { castleWar } from './en-castle-war.ts';
import { steading } from './en-steading.ts';
import { heirlooms } from './en-heirlooms.ts';
import { social } from './en-social.ts';
import { closedTest } from './en-test.ts';
import { moderation } from './en-moderation.ts';
import { consoleWords } from './en-console.ts';
import { consoleMoreWords } from './en-console-more.ts';
import { bannerWords } from './en-banner.ts';
import { mail } from './en-mail.ts';
import { legal } from './en-legal.ts';
import { progress } from './en-progress.ts';
import { skills } from './en-skills.ts';
import { supplies } from './en-supplies.ts';

export const en: Record<string, string> = {
  // The shell: header, menu, lanes, sheets
  'shell.name': 'Idle Clash',
  'shell.pageTitle': '{page} · Idle Clash',
  'shell.menu': 'Main menu',
  'shell.skip': 'Skip to the page',
  'shell.fire.out': 'Stoke',
  'shell.fire.outLabel': 'The fire is out. Stoke it for more XP and a second Gathering lane',
  'shell.fire.burningLabel':
    'The fire burns for {time} more, giving {pct}% more XP. Keep it burning and it grows hotter',
  'shell.fire.heat': '+{pct}%',
  'shell.gold': '{amount} gold',
  'shell.reconnecting': 'Reconnecting. Your lanes keep working.',
  'shell.notices': 'Notices',
  'shell.account': 'Your account',
  'shell.lanes': 'Lanes',
  'shell.close': 'Close',
  'menu.hearth': 'Hearth',
  'menu.skills': 'Skills',
  'menu.combat': 'Combat',
  'menu.storehouse': 'Storehouse',
  'menu.storehouse.short': 'Store',
  'menu.hiscores': 'Hiscores',

  // Pages
  'hearth.title': 'Hearth',
  'hearth.welcome.title': 'Welcome to the march',
  'hearth.welcome.body': 'Levels, finds and goals you reach today show here, newest first. Start with a first step.',
  'hearth.quiet.title': 'Today',
  'hearth.quiet.body': 'Nothing yet today: your levels, finds and goals will show here as they come.',
  'hearth.next.title': 'Next up',
  'hearth.today.title': 'Today',
  'tray.today': 'Today',
  'tray.yesterday': 'Yesterday',
  'tray.unread': '{count} new notices',
  'tray.unreadOne': '1 new notice',
  'hearth.lanes.title': 'Your lanes',
  'skills.title': 'Skills',
  'skill.actions.title': 'Actions',
  'skill.tiers': 'Tiers',
  'skill.tier': 'Tier {tier}',
  'skill.ladder.title': 'Every level',
  'combat.title': 'Combat',
  'hiscores.title': 'Hiscores',
  'hiscores.total': 'Total',
  'hiscores.rank': 'Rank',
  'hiscores.name': 'Name',
  'hiscores.level': 'Level',
  'hiscores.xp': 'XP',
  'hiscores.ladders': 'Ladders',
  'hiscores.online': '{count} playing now',
  'hiscores.milestones': '{count} milestones',
  'hiscores.milestonesOne': '1 milestone',
  'hiscores.unranked': 'Your rank appears after your first level.',
  'hiscores.empty': 'No one is on this ladder yet.',
  'action.start': 'Start',
  'action.queue': 'Next',
  'action.working': 'In your lane',
  'notFound.title': 'Nothing here',
  'notFound.lead': 'This page does not exist.',
  'fault.title': 'Something broke here',
  'fault.lead': 'It has been reported. Your lanes keep working; reload to carry on.',
  'fault.reload': 'Reload',
  // A browser too old for the game, or with its scripts off (session 207), said before the game loads.
  'browser.tooOld':
    'This browser is too old for Idle Clash. Update it, or open the game in a newer one: Safari, Chrome, Firefox or Edge from 2022 on.',
  'browser.noScript': 'Idle Clash needs JavaScript. Switch it on for this site to play.',
  'tour.title': 'Getting started',
  'tour.goals': 'Start here: each first step has a button that starts it, and pays when it is done.',
  'tour.lanes': 'Your lanes do the work, and keep at it for up to a day while you are away.',
  'tour.fire': 'All you do keeps the fire lit for {time}: more XP the longer it burns, and a second Gathering lane.',
  'tour.notices': 'Notices say when a lane stops and why, and what happened while you were away.',
  'tour.next': 'Next',
  'tour.skip': 'Skip the tour',
  'tour.done': 'Done',
  'tray.empty': 'Nothing needs you right now.',
  'settings.title': 'Settings',
  'settings.sound': 'Sound',
  'settings.sound.off': 'Off',
  'settings.sound.moments': 'Levels, finds and goals',
  'settings.sound.all': 'Also each action, softly',
  'settings.theme': 'Theme',
  'settings.theme.system': 'Match this device',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.signedInAs': 'Signed in as {name}',
  'settings.signOut': 'Sign out',
  'settings.delete': 'Delete account',
  'settings.delete.warning':
    'Deleting your account removes your save, your hiscores, your notices and your name at once. It cannot be undone.',
  'settings.delete.password': 'Your password',
  'settings.delete.confirm': 'Delete everything',
  'settings.delete.cancel': 'Keep my account',
  'settings.delete.wrong': 'That is not your password.',
  'legal.back': 'Back',

  // The welcome page, before signing in
  'welcome.title': 'Idle Clash',
  'welcome.lead': 'Gather, smith and fight. Your lanes keep working while you are away.',
  'welcome.tabs': 'Create an account or sign in',
  'welcome.create': 'Create account',
  'welcome.signIn': 'Sign in',
  'welcome.name': 'Name',
  'welcome.name.hint': 'Shown on the hiscores.',
  'welcome.password': 'Password',
  'welcome.password.hint': 'At least 10 characters.',
  'welcome.age': 'I am 13 or older',
  'welcome.forgot': 'Forgot it? Write to {address} and an admin can reset it.',
  'welcome.working': 'One moment…',
  'welcome.offline': 'Cannot reach the server. Check your connection.',
  'welcome.retry': 'Try again',
  'error.name': 'Use 3 to 16 letters or digits, with single spaces, - or _ between them.',
  'error.password': 'Use at least 10 characters.',
  'error.age': 'Idle Clash is for players aged 13 and over.',
  'error.nameTaken': 'That name is taken. Try another.',
  'error.nameNotAllowed': 'That name is not allowed here. Try another.',
  'error.wrongNameOrPassword': 'That name and password do not match.',
  'error.banned': 'This account is closed.',
  'welcome.deleted': 'Your account is deleted, and everything it held with it.',
  'welcome.ended': 'You were signed out. Sign in to carry on where you left off.',
  'error.tooManyTries': 'Too many tries. Try again in {wait}.',
  'error.offline': 'Could not reach the server. Check your connection and try again.',
  'error.other': 'Something went wrong on our side. Try again in a moment.',

  // Why a lane stopped (kernel codes)
  'stop.unavailable': 'That action is not available',
  'stop.wrongLane': 'That action belongs in another lane',
  'stop.alreadyRunning': 'Your lane already does that, and repeats it',
  // A lane holds three to come (session 240).
  'stop.alreadyQueued': 'Already next in your lane',
  'stop.queueFull': 'Your lane holds {most} to come: let one go first',
  'stop.fireOut': 'The fire went out',
  'stop.stoppedByPlayer': 'Stopped',
  'stop.mended': 'Stopped while your save was mended',
  'stop.levelTooLow': 'Needs level {level}',
  'stop.skillInOtherLane': 'Already working in your other Gathering lane',
  'stop.outOfInputs': 'Out of {item}',
  'stop.needsKey': 'Needs the {item}',
  // The same, short enough for a lane's chip on a phone (where a reason's full words are longer)
  'stopShort.needsKey': 'Needs a key',
  'stopShort.unavailable': 'Not available',
  'stopShort.wrongLane': 'Wrong lane',
  'stopShort.alreadyRunning': 'Already doing',
  'stopShort.alreadyQueued': 'Already next',
  'stopShort.queueFull': 'Next is full',
  'stopShort.fireOut': 'Fire went out',
  'stopShort.mended': 'Stopped',
  'stopShort.skillInOtherLane': 'Already busy',

  // Effects: what perks and mastery do
  'effect.speed': '{pct} faster',
  'effect.extraYield': '+{pct} chance of an extra item',
  'effect.findChance': 'Rare and Legendary finds {pct} likelier',
  'effect.masteryGain': 'mastery {pct} faster',
  'effect.saveInput': '{pct} chance to save an ingredient',
  'effect.damage': '+{pct} damage',
  'effect.accuracy': '+{pct} to hit',
  'effect.guard': '{pct} less damage taken',
  'effect.spoils': '+{pct} gold and drops',
  'effect.maxHealth': '+{amount} health',
  'effect.regen': 'health returns {pct} faster',
  'effect.foodHeal': 'food heals {pct} more',
  'effect.retreatAt': 'retreat at {pct} health instead of {base}',

  // Skills, shared by every skill page
  'skill.level': 'Level {level}',
  'skill.toNext': '{xp} XP to level {level}',
  'skill.nextUnlock': 'Level {level}: {unlock}',
  'skill.xpAway': '{xp} XP away',
  'unlock.perk': '{name} ({effect} in all)',
  'unlock.perkFirst': '{name} ({effect})',
  'unlock.wield': 'Wield {metal} {weapons}',
  'unlock.wear': 'Wear {metal} armour',
  'unlock.foe': 'Foe: {foe}',
  'unlock.food': 'The vendor sells {food}',
  'tier.metal.1': 'Copper',
  'tier.metal.2': 'Bronze',
  'tier.metal.3': 'Iron',
  'tier.metal.4': 'Steel',
  'tier.metal.5': 'Moonsilver',
  'tier.metal.6': 'Star-iron',
  'tier.metal.7': 'Embersteel',
  'tier.metal.8': 'Dawnsteel',
  'weapons.melee': 'swords',
  'weapons.archery': 'bows',
  'weapons.magic': 'staves',
  'unlock.perkOnce': '{name} ({effect})',
  'action.opensAt': 'Opens at level {level}',
  'action.xpPerHour': '{xp} XP an hour',
  'action.gives': '{item} ×{count}',
  'action.givesAverage': '{item} ×{count} on average',
  'action.takes': 'Takes {items}',
  'action.needs': 'Needs {items} (kept)',
  'action.needsMissing': 'Needs {items}, not held',
  'mastery.step': 'Mastery {step}',

  // Moments
  'moment.levelUp': '{skill} level {level}',
  'moment.unlocked': 'Unlocked: {unlock}.',
  'moment.find': '{rarity} find: {item}',
  'moment.find.first': 'New in your collection log.',
  'moment.masteryStep': '{action}: mastery {step}',
  'moment.findUsed': '{item} used on {action}',
  'moment.findUsed.body': '+{count} mastery completions',
  'moment.goalDone': 'Goal done: {goal}',
  'moment.also': 'Also: {what}.',
  'moment.alsoDone': 'Also done: {what}.',
  'moment.close': 'Close',
  'moment.laneStopped': '{lane} stopped: {reason}',

  // Finds and the collection log
  'rarity.uncommon': 'Uncommon',
  'rarity.rare': 'Rare',
  'rarity.legendary': 'Legendary',
  'find.foundOn': 'Found {date}',
  'find.greaterHint': 'Tier {tier} and up',
  'find.greaterFoe': 'Foes of tier {tier} and up',
  'find.anyAction': 'Any {skill} action',
  'find.anyFoe': 'Any foe fought with {skill}',
  'collection.progress': '{found} of {total} found',
  'skill.finds.title': 'Finds',

  ...skills,
  ...food,
  ...supplies,
  ...combat,
  ...legal,
  ...progress,
  ...deeds,
  ...honours,
  ...companions,
  ...expeditions,
  ...kindling,
  ...seasons,
  ...yearTwo,
  ...push,
  ...store,
  ...lanes,
  ...steading,
  ...heirlooms,
  ...social,
  ...closedTest,
  ...moderation,
  ...consoleWords,
  ...consoleMoreWords,
  ...bannerWords,
  ...mail,
  ...castle,
  ...castleWar,
};
