const Filter = require('bad-words');
const axios = require('axios');
const express = require('express');
const router = express.Router();

const apiKey = process.env.OPENAI_API_KEY;
const client = axios.create({
  headers: { 'Authorization': 'Bearer ' + apiKey }
});

// Add your documents here. These will be used to answer questions. You can add up to 200.
// Alternately, you can store documents in a file. See: https://beta.openai.com/docs/api-reference/answers 

const documents = [
  "This app was built using JavaScript and Node.JS.<|endoftext|>",
  "The app has a simple HTML form that users can use to submit questions.<|endoftext|>",
  "GPT-3 will use documents provided by the developer as a knowledge base to derive answers from.<|endoftext|>",
  "This is an example application that can be used to learn how to build apps using the OpenAI API.<|endoftext|>"
]

const endpoint = 'https://api.openai.com/v1/answers';

// save all the checks into a function
const check = () => {
  if (!apiKey) {
    res.send({ "answer": "You need to setup your API key." });
    return 0;
  };
  // respond if the rate limit is exceeded
  if (req.rateLimit.remaining == 0) {
    res.send({ "answer": "Ask me again in a minute." });
    return 0;
  };
  // respond if the request length is too long
  if (req.body.question.length > 150) {
    res.send({ "answer": "Sorry. That question is too long." });
    return 0;
  }
  let filter = new Filter();
  if (filter.isProfane(req.body.question)) {
    res.send({ "answer": "That’s not a question we can answer." });
    return 0;
  }
  // respond if the request is not a string
  if (typeof req.body.question !== 'string') {
    res.send({ "answer": "That’s not a question we can answer." });
    return 0;
  }
  // respond if the request is empty
  if (req.body.question.length == 0) {
    res.send({ "answer": "The question is empty." });
    return 0;
  }
  return 1;
}
const incrementModel = (model) => {
  models = ['ada','babbage', 'curie', 'davinci']
  if (!model){
    return 'ada'
  }
  let index = models.indexOf(model)
  if (index == models.length - 1){
    return models[-1], {comment : 'You have reached the end of the list.'}
  }
  return models[index + 1]
}

const questionType = (question) => {
  if (question == 'Multiple Choice'){
    return ['This is a multiple choice question.', [['How many primary colors are there? [a:2, b:3, c:4, d:5]', 'b'], 
    ['How many presidents are there in the USA? [a:15, b:26, c:50, d:46]', 'd'], 
    ['How many continents are there? [a:7, b:8, c:9, d:10]', 'a']]]
  }
  if (question == 'True or False'){
    return ['This is a true or false question.', [['Is the sky blue? [a:True, b:False]', 'a'], ['Is america a democracy? [a:True, b:False]', 'a'], ['Napoleon attacked Russia in 1815? [a:True, b:False]', 'b']]]
  }
  if (question == 'Short Answer'){
    return ['This is a short answer question.', [['Discuss the meaning of life.', 'Life is a great opportunity all of us get and some people take advantage of it and some dont. but the meaning is obviously 42.']]]
  }
  if (question == 'fill in the blank'){
    return ['NOT IMPLEMENTED YET', [['NOT IMPLEMENTED YET', 'NOT IMPLEMENTED YET']]]
  }
}


router.post('/', (req, res) => {
  // make sure the OPENAI_API_KEY env var is set
  if (check() == 0) {
    return;
  }
  let subject = req.body.subject;
  let subjectDocuments = documents[subject];  //need to get the books sliced 
  // get the question type
  let questionType = req.body.questionType;
  // get the question
  let question = req.body.question;
  // get the model
  let questionMetaData = questionType(questionType)
  let examples_context = questionMetaData[0]
  let examples = questionMetaData[1]
  const data = {
    // "file": process.env.ANSWERS_FILE,
    "documents": subjectDocuments,
    "question": req.body.question,
    "search_model": "ada",
    "model": "curie",
    "examples_context": examples_context,
    "examples": examples,
    "max_tokens": 50,
    "temperature": 0,
    "return_prompt": false,
    "expand": ["completion"],
    "stop": ["\n", "<|endoftext|>"],
  }
  client.post(endpoint, data)
    .then(result => {
      res.send({ "answer": result.data.answers[0] })
    }).catch(err => {
      // deal with API request errors
      res.send({ "answer": `Sorry, there was an API error. The error was '${err.message}'` })
    });
});

module.exports = router;

