# The closed test

The one test with players before launch (the owner's decision, 26 October 2026; `docs/EXPANSION.md`).
Everything it needs is built (step 18); it starts when the owner puts the server up and says go. The
game is not advertised until launch, so the players are the owner's friends, sent the address by the
owner: signing up is open, and there are no invites (taken out in session 19, the owner's call).

## What it must show

The brief's own target, which no simulation can measure: **all five testers come back on days 2 and 3,
and each can say what they are aiming for next.** Beside it, the things only people can tell us: what
puzzled them, what they enjoyed, what felt slow, and anything that broke.

## Before it starts

1. The server is up (`OPERATIONS.md`), and the owner has signed in to the admin console as `Admin` at
   https://idleclash.com/admin and chosen its own password (until then it holds the first password,
   `Password`, which anyone reading the repository knows: session 237).
2. Send each friend the message below.

## Who

Five players, chosen to differ:

- one who knows idle games or RuneScape-like games well;
- one who has never played either;
- one who will play mostly on a phone, and one mostly on a computer;
- one who is not a friend of the team, so politeness does not hide boredom.

Everyone must be 13 or older (the terms say so, and the sign-up asks).

## The message to send each tester

> You're invited to try Idle Clash before anyone else, a game you play in a few minutes here and there:
> your workers keep gathering, smithing and fighting while you're away.
>
> 1. Go to https://idleclash.com and choose Create account.
> 2. Play as much or as little as you like for two weeks. Settings has **Send feedback**: use it for
>    anything at all, the moment you think of it.
>
> We'll ask you three short questions on your third day. Questions or trouble: admin@idleclash.com

## How long

Two weeks. Days 1 to 3 answer the target; the rest shows the second tier, the first expedition and
the first deeds and titles, where the year's simulation says the game's shape changes.

## What to watch, each day

The admin console's **Closed test** section (`/admin/test`), its **Player activity** and **Feedback** panels
(it lists the newest 25 players; the console's **Players** section holds everyone):

- **Back on day 2 / day 3** for each tester. Anyone not back on day 2: write to them that day and ask,
  kindly, what made them stop. That answer is worth more than any number.
- **Aiming for:** what the Hearth's goals ask of each tester now. Compare it with their own answer on
  day 3: if they name something else, the goals are not pointing where players look.
- **Feedback**, newest first. Answer each within a day. **Copy all** (or **Copy** on one note) gives
  plain text with who sent it, their total level and days played, the page and the day: paste it into
  a session with Claude to weigh whether each note has merit and act on those that do.
- **Days played** and **total level**: a tester far behind the others may be stuck rather than busy.

The server's error reports and lane stops are counted in telemetry; a lane that stops for the same
reason for several testers is a bug or a missing word.

## The three questions, on day 3

1. What are you aiming for next in the game?
2. What, if anything, confused you or got in your way?
3. Would you keep playing if we stopped asking? Why, or why not?

On the last day: what did you like most, what would you change first, and would you recommend it?

## What decides launch

- All five back on days 2 and 3, and each names an aim on day 3 that the game itself set them.
- No save lost or damaged (a player's record in the console shows every repair under Save; there should be
  none).
- Nothing that blocks play, open.
- The owner is satisfied: launch waits for the owner, as decided.

## What the year's simulation asks the test to look at

The year-long simulation (`GAME_DESIGN.md` section 4) holds every target, and it raised these for
people to judge:

- **Gold and the steading.** Once the Storehouse is fully enlarged, around the second month, gold
  goes to the steading's works (session 25), which take about 470 million over the year. Whether the
  first raisings come soon enough to matter in a two-week test is worth asking.
- **Combat finishes first.** Fighting reaches 99 in all three styles around day 237, months before
  the gathering skills (about day 336); Hitpoints keeps pace with the best style since session 177. Kindling keeps those
  skills going, but whether the fighters feel done early is worth asking later players.
- **Moments in a long session.** After the first week, about half of the moments in an active hour are
  Uncommon finds. If testers say finds stop feeling special, that is why.

The design audit of 27 November (`docs/DESIGN_AUDIT.md`) adds four:

- **A castle left unraised.** Castle Clash carries year two (without it, something new on about one day
  in four). Any tester who leaves the castle unraised after a week: ask why, and what they aim for instead.
- **The steading's sources.** Whether a tester whose work asks for Uncommon finds follows its "Any Cooking
  action" line back to the skill.
- **The light pattern.** Whether a few minutes twice a day feels it is keeping up.
- **A full Next up.** Whether a veteran's Next up reads as things to do or as a wall.

## After

Testers keep their accounts
and saves: they earned them. Each change the test asks for is made the usual way: a session, verify
green, and a line in the changelog.
