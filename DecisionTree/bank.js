const fs = require('fs')

const { ID3, heuristics } = require('./decisionTree')

const arrToBank = ([age,job,marital,education,defult,balance,housing,loan,contact,day,month,duration,campaign,pdays,previous,poutcome,label]) => ({age,job,marital,education,default:defult,balance,housing,loan,contact,day,month,duration,campaign,pdays,previous,poutcome,label})

const numAttribs = ['age', 'balance', 'day', 'duration', 'campaign', 'pdays', 'previous']

const fileToBank = path => {
  const fileContent = fs.readFileSync(path, { encoding: 'utf8' })

  const banks = fileContent.split(/\n/g).map(bankString => arrToBank(bankString.split(/,/g)))
  banks.splice(-1, 1)

  const numValues = banks.reduce((numValues, bank) => {
    numAttribs.forEach(attrib => {
      if(numValues[attrib])
        numValues[attrib].push(bank[attrib])
      else
        numValues[attrib] = []
    })

    return numValues
  }, {})

  const medians = Object.entries(numValues).reduce((medians, [attrib, values]) => {
    const sorted = values.sort()

    let median
    if(sorted.length % 2 === 0) {
      median = (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2
    } else {
      median = sorted[Math.floor(sorted.length/2)]
    }

    medians[attrib] = median
    return medians
  }, {})

  const formattedBanks = banks.map(bank => {
    numAttribs.forEach(attrib => {
      bank[attrib] = bank[attrib] > medians[attrib] ? '>' : '<'
    })
    return bank
  })

  return formattedBanks
}

const getLabel = (bank, bankDecisionTree) => {
  let bankTree = bankDecisionTree
  while(true) {
    const { attribute, label, nodes } = bankTree

    if(label) return label

    const value = bank[attribute]

    bankTree = nodes[value]
  }
}

const runTest = (testBanks, bankDecisionTree) => testBanks.reduce(
  (errors, testBank) => getLabel(testBank, bankDecisionTree) === testBank.label ? errors : errors + 1, 0
)

const trainingBanks = fileToBank('./bank/train.csv')
const testBanks = fileToBank('./bank/test.csv')

const attributes = [
  { name: 'age', values: ['<', '>'] },
  { name: 'job', values: ["admin.","unknown","unemployed","management","housemaid","entrepreneur","student","blue-collar","self-employed","retired","technician","services"] },
  { name: 'marital', values: ["married","divorced","single"] },
  { name: 'education', values: ["unknown","secondary","primary","tertiary"] },
  { name: 'default', values: ["yes","no"] },
  { name: 'balance', values: ['<', '>'] },
  { name: 'housing', values: ["yes","no"] },
  { name: 'loan', values: ["yes","no"] },
  { name: 'contact', values: ["unknown","telephone","cellular"] },
  { name: 'day', values: ['<', '>'] },
  { name: 'month', values: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] },
  { name: 'duration', values: ['<', '>'] },
  { name: 'campaign', values: ['<', '>'] },
  { name: 'pdays', values: ['<', '>'] },
  { name: 'previous', values: ['<', '>'] },
  { name: 'poutcome', values: ["unknown","other","failure","success"] }
]

const makeBankDecisionTree = (heuristic, depth) => ID3(trainingBanks, attributes, heuristic, depth)

const bank1 = () => {
  const testData = Object.entries(heuristics).reduce((data, [name, func]) => Object.assign(data, {
    [name]: {
      training: Array(6).fill(1).map((x,y)=>x+y).reduce((sum, i) => sum + runTest(trainingBanks, makeBankDecisionTree(func, i)), 0) / 6,
      test: Array(6).fill(1).map((x,y)=>x+y).reduce((sum, i) => sum + runTest(testBanks, makeBankDecisionTree(func, i)), 0) / 6
    }
  }), {})

  console.table(testData)
}

const majorityValues = attributes.map(({ name, values }) => {
  const counts = trainingBanks.reduce((counts, bank) => {
    counts[bank[name]]++
    return counts
  }, values.reduce((counts, value) => {
    counts[value] = 0
    return counts
  }, {}))

  const { majority } = Object.entries(counts).reduce(({ majority, max }, [name, value]) => value > max ? { majority: name, max: value } : { majority, max }, { max: 0 })

  return { name, majority }
}).reduce((obj, { name, majority }) => Object.assign(obj, { [name]: majority }), {})

const bank2 = () => {
  const unknownAttribs = ['job', 'education', 'contact', 'poutcome']

  const trainingBanks2 = trainingBanks.map(bank => {
    unknownAttribs.forEach(attrib => {
      if(bank[attrib] === 'unknown') {
        bank[attrib] = majorityValues[attrib]
      }
    })

    return bank
  })

  const testBanks2 = testBanks.map(bank => {
    unknownAttribs.forEach(attrib => {
      if(bank[attrib] === 'unknown') {
        bank[attrib] === majorityValues[attrib]
      }
    })

    return bank
  })

  const makeBankDecisionTree2 = (heuristic, depth) => ID3(trainingBanks2, attributes, heuristic, depth)

  const testData = Object.entries(heuristics).reduce((data, [name, func]) => Object.assign(data, {
    [name]: {
      training: Array(6).fill(1).map((x,y)=>x+y).reduce((sum, i) => sum + runTest(trainingBanks2, makeBankDecisionTree2(func, i)), 0) / 6,
      test: Array(6).fill(1).map((x,y)=>x+y).reduce((sum, i) => sum + runTest(testBanks2, makeBankDecisionTree2(func, i)), 0) / 6
    }
  }), {})

  console.table(testData)
}

console.log('Part 2 - Question 3a - bank')
bank1()

console.log('Part 2 - Question 3b - bank')
bank2()
