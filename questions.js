/* questions.js
   Skill tags: "mainIdea" | "evidence"
   difficulty: 1 (easy) ... 5 (hard)
*/

window.QUESTION_BANK = [
  {
    id: "R1",
    skill: "mainIdea",
    difficulty: 1,
    passage:
`Every morning, Mr. Ortega watered the same small strip of plants behind his apartment building. Most people walked past without noticing. But after a few weeks, neighbors began stopping to talk. Someone brought extra soil. Another person donated seeds. Soon, the once-bare patch had basil, peppers, and bright marigolds. People who had never introduced themselves before started sharing recipes and arguing (nicely) about where the sun hit best. The garden wasn’t huge, but it changed how the building felt—less like a place where strangers lived, and more like a place where people belonged.`,
    question: "What is the main idea of the passage?",
    choices: [
      "A small community garden helped neighbors connect and feel more like a community.",
      "Basil grows best when it receives the strongest sunlight.",
      "Marigolds are the most colorful plants in a neighborhood garden.",
      "Mr. Ortega was upset that people walked past his plants."
    ],
    answerIndex: 0,
    explanation: "The passage focuses on how the garden changed relationships and built community."
  },
  {
    id: "R2",
    skill: "evidence",
    difficulty: 1,
    passage:
`During practice, Coach Li didn’t raise his voice. Instead, he stopped drills whenever players looked frustrated. “Reset,” he would say, and everyone would take a breath before trying again. At first, the team thought it was a waste of time. But over the season, they started making fewer careless mistakes. Players who used to quit on tough plays began asking for feedback. The team didn’t just get better at basketball—they got better at staying calm.`,
    question: "Which detail best supports the idea that the team improved at staying calm?",
    choices: [
      "Coach Li didn’t raise his voice during practice.",
      "The team thought resetting was a waste of time at first.",
      "Players began asking for feedback instead of quitting on tough plays.",
      "The team got better at basketball over the season."
    ],
    answerIndex: 2,
    explanation: "Asking for feedback instead of quitting shows calmer, more controlled reactions under pressure."
  },

  // --- Medium (2–3)
  {
    id: "R3",
    skill: "mainIdea",
    difficulty: 2,
    passage:
`Kara loved mystery novels, but she never finished them the way most people did. She would read the first few chapters, then flip to the last page to see who did it. Her brother said that ruined the whole point. Kara disagreed. “Knowing the ending doesn’t erase the journey,” she said. In fact, she liked spotting the clues the author planted. While her brother chased surprises, Kara chased patterns.`,
    question: "What is the main idea of the passage?",
    choices: [
      "Kara reads mystery novels differently because she enjoys noticing patterns and clues.",
      "Mystery novels are better when the ending is hidden from the reader.",
      "Kara’s brother prefers surprises because he reads faster than Kara.",
      "Authors should not plant clues because it makes mysteries too easy."
    ],
    answerIndex: 0,
    explanation: "It’s about Kara’s different reading style and why she likes it."
  },
  {
    id: "R4",
    skill: "evidence",
    difficulty: 2,
    passage:
`The city installed new crosswalk lights near the middle school. The first week, students still rushed across without waiting for signals. But teachers reminded them every day. Soon, the number of close calls dropped. Even drivers seemed to slow down earlier, noticing the flashing lights from farther away. By the end of the month, the crosswalk looked calmer—like everyone finally agreed to share the space.`,
    question: "Which detail best supports the idea that the crosswalk became safer?",
    choices: [
      "The city installed new crosswalk lights near the middle school.",
      "Teachers reminded students every day.",
      "The number of close calls dropped after the first week.",
      "Drivers noticed the flashing lights from farther away."
    ],
    answerIndex: 2,
    explanation: "A drop in close calls is direct evidence of improved safety."
  },

  // --- Hard (4–5)
  {
    id: "R5",
    skill: "mainIdea",
    difficulty: 4,
    passage:
`When the museum announced free admission on Sundays, the director expected more visitors, but she didn’t expect the questions. People asked why art mattered when rent was rising. A teenager asked why portraits were mostly of wealthy people. A father asked why the museum felt quiet, like it wasn’t meant for his family. The director began hosting short talks where visitors could respond out loud, not just listen. Attendance stayed high, but more importantly, the building felt less like a vault and more like a conversation.`,
    question: "What is the main idea of the passage?",
    choices: [
      "Free admission can turn a museum into a more welcoming place where people engage and ask meaningful questions.",
      "Most museum portraits should be replaced with portraits of teenagers.",
      "Rent increases are the main reason people visit museums less often.",
      "Museums should remain quiet so visitors can focus on the art."
    ],
    answerIndex: 0,
    explanation: "The passage emphasizes how access + dialogue made the museum more welcoming and engaged."
  },
  {
    id: "R6",
    skill: "evidence",
    difficulty: 4,
    passage:
`Jamal started bringing a notebook on walks. At first, he only wrote down obvious things—street names, store signs, the time. Then he noticed patterns: a dog that always barked at the same fence, a delivery truck that arrived late every Thursday, a tree whose leaves changed color earlier than the others. After a month, Jamal said he felt like his neighborhood had “more layers.” Nothing had changed, really. He had just trained himself to see more.`,
    question: "Which detail best supports the idea that Jamal learned to notice more?",
    choices: [
      "He wrote down street names and store signs at first.",
      "He noticed a delivery truck that arrived late every Thursday.",
      "He took walks around his neighborhood.",
      "He said his neighborhood had 'more layers.'"
    ],
    answerIndex: 1,
    explanation: "The repeated pattern about the delivery truck is concrete evidence of deeper noticing."
  }
];
