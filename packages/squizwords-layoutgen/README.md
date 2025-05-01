# Layout Generator

Layout Data Structure
```json
[{
    "clue": "a point where two things can connect and interact",
    "answer": "interface",
    "startx": 1,
    "starty": 1,
    "orientation": "down",
    "position": 5
  }]
```

## Things that can go wrong

1. The generated layouts don't always contain all of the input words. If a word does not appear in the layout, then its orientation attribute will be set to "none".

Level: Critical

2. The generated crossword layouts are not always connected. Occasionally, there will be islands of disconnected words.

Level: Suboptimal

3. Occasionally two words in the same direction overlap.

Level: Critical
