# AI Suffer — Prompt Log

This document records the project prompts supplied during the current development conversation and the prompts contained in the provided source text document. The prompts are preserved as a faithful English translation so that the project history remains accessible to English-speaking contributors.

## 1. Prompts from the Provided Source Document

### Prompt 01 — Initial Game Concept

> Using Go (Golang), HTML, CSS, and JavaScript, create a page for a 2D game.
>
> The idea of the game is simple: the character is a programmer who has to fight against AI. At a certain point, the player must climb a tower of bosses. For example, make it five “mini-bosses” and a final boss.
>
> Bosses, from easiest to hardest:
> - Add one boss whose name you can choose because I cannot think of one.
> - Kimi
> - DeepSeek
> - Grok
> - ChatGPT
> - Claude
>
> Add sound effects.

### Prompt 02 — Reference Game and Tower Progression

> Using this game as a reference: https://store.steampowered.com/app/2085540/Stick_It_to_the_Stickman/
>
> I want progression to work by climbing the tower. Improve the graphics, especially the player character. For now, name the project “AI Suffer”. Increase the difficulty, especially for the boss “Claude”, which ended up being far too easy compared with ChatGPT.

### Prompt 03 — Elevator and Upgrade Selection

> This is good. Improve the skill-selection menu after completing a level. Then, instead of automatically sending the player to the next level, make progression work like the reference game: the player should climb the tower using an elevator that unlocks after completing the floor. When the player enters the elevator, ask which skill they want to select. Improve the enemy designs.

### Prompt 04 — Music, Low-Health Effect, and Hordes

> This is very good. To improve it, add background music both in the menu and in the game. Also add a screen effect when the player has low health. Another thing you could add is that instead of fighting the bosses directly, the player must first defeat enemy hordes, and as they climb the tower, the hordes become larger and more difficult.

### Prompt 05 — Broken Music, Low-Health Effect, and Hordes

> The music, low-health effect, and hordes do not work.

### Prompt 06 — Game Over and Music Transition Fixes

> There is a problem: when I died in the game, the game-over screen did not appear, and the console showed an error saying that the function “Music.stop” does not exist. Fix that error, and significantly improve the music because the transitions between scenes are very strange, unnatural, and unpleasant to listen to.

### Prompt 07 — Reset Low-Health Effect

> There is a bug: when I win a game while the low-health effect is active, the effect continues appearing on the main menu. Fix that.

### Prompt 08 — Remove Crossing Lines

> Also remove those lines at the top and bottom that look like they are “crossing” the interface. They look bad.

### Prompt 09 — Title and Borders

> Fix the title so that it is centered, and fix the borders that are not connected correctly.

### Prompt 10 — SimSimi Easter Egg

> Add an Easter egg: when everything is unlocked (achievements and pets), a boss should become available after defeating Boss Claude. The boss must be SimSimi (the yellow character from the provided image). It should attack by throwing random insults at the player, and when it attacks it should make an annoying sound (use any sound you want). If one of its attacks hits the player, reduce the player's firing rate.

### Prompt 11 — Konami Code

> Add a Konami code to unlock the Easter egg.

### Prompt 12 — Character Customization

> Add a section to the menu for customizing the character, allowing the player to change its color.

### Prompt 13 — Homing Bullet Bug

> Fix the bullet that follows the enemy, because when that bullet hits the enemy, it does not disappear.

### Prompt 14 — Provided Audio Assets

> In the project (`static/sounds`), I added two `.mp3` files. `finish.mp3` should play when the player finishes the game (after defeating all bosses), and `compras-mejora.mp3` should play when a player purchases an upgrade during the game.

### Prompt 15 — Title Typography and Homing Bullet Lifetime

> There are a few things that need to be fixed. First, I want the title to use the same letter format it had before.
>
> Then, when bullets have the ability to correct their direction toward an enemy, make them disappear after a certain number of seconds, because sometimes they remain across the map while continuously tracking enemies, which makes the game too easy.
>
> Finally, add a special code that allows the player to go directly to the SimSimi Easter egg battle without having to defeat every boss first.

## 2. Prompts from the Current Development Conversation

### Prompt 16 — V25 Runtime Error

> `game.js?v=25:1348 Uncaught ReferenceError: G is not defined at loop (game.js?v=25:1348:39)`
>
> The error repeatedly points to `loop` and `requestAnimationFrame`.

### Prompt 17 — Error Persists

> The same error continues:
>
> `game.js?v=25:1348 Uncaught ReferenceError: G is not defined at loop (game.js?v=25:1348:39)`

### Prompt 18 — V27 Runtime Error

> `game.js?v=27:317 Uncaught ReferenceError: G is not defined at HTMLDocument.unlockAudioOnFirstInteraction (game.js?v=27:317:3)`
>
> The same error continues. Fix it.

### Prompt 19 — Pet Menu and Start Button

> As shown in the screenshot, the pet menu still looks wrong, the scrollbar should not be visible, and the button to start the game still does not work, although no error is thrown.

### Prompt 20 — Harder Pet and Achievement Progression

> Increase the difficulty of obtaining pets. The increase in difficulty should be clearly noticeable between pet rarities. Then add an achievement system. Also make achievements difficult to unlock, and categorize them by difficulty, from easy achievements to achievements requiring more playtime and a strong understanding of specific mechanics.

### Prompt 21 — Advanced Difficulty and Adaptive Enemy AI

> Make it even harder, both for achievements and pet unlocks, and increase the difficulty at every stage rather than only through enemy health and firing behavior. Improve the AI of all enemies. I would like enemies in hordes to spawn from both sides, and I do not want an enemy to stop moving when it reaches the opposite side; it should keep moving. It would also be good if enemies attempted to dodge bullets, with increasingly accurate dodging at higher difficulty levels. Bosses should be able to jump and/or dodge in other ways. I think this will add another layer of difficulty to the game.

### Prompt 22 — Downloadable Build Request

> Provide the file so that I can download it.

### Prompt 23 — Download Link Issue

> The download link does not work. When I click “Download AI Suffer V31” it appears as normal text.

### Prompt 24 — Enemy Clipping Below the Floor

> There is a problem: some enemies move below the ground and I cannot aim at them because I cannot move the cursor below the green ground line.
