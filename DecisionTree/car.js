const fs = require('fs')

const { ID3, heuristics } = require('./decisionTree')

const arrToCar = ([buying,maint,doors,persons,lug_boot,safety,label]) => ({buying,maint,doors,persons,lug_boot,safety,label})

const fileToCars = path => {
  const fileContent = fs.readFileSync(path, { encoding: 'utf8' })

  const cars = fileContent.split(/\n/g).map(carString => arrToCar(carString.split(/,/g)))
  cars.splice(-1, 1)
  return cars
}

const getLabel = (car, carDecisionTree) => {
  let carTree = carDecisionTree
  while(true) {
    const { attribute, label, nodes } = carTree

    if(label) return label

    const value = car[attribute]
    carTree = nodes[value]
  }
}

const runTest = (testCars, carDecisionTree) => testCars.reduce(
  (errors, testCar) => getLabel(testCar, carDecisionTree) === testCar.label ? errors : errors + 1, 0
)


const trainingCars = fileToCars('./car/train.csv')
const testCars = fileToCars('./car/test.csv')

const attributes = [
  { name: 'buying', values: ['vhigh', 'high', 'med', 'low'] },
  { name: 'maint', values: ['vhigh', 'high', 'med', 'low'] },
  { name: 'doors', values: ['2', '3', '4', '5more'] },
  { name: 'persons', values: ['2', '4', 'more'] },
  { name: 'lug_boot', values: ['small', 'med', 'big'] },
  { name: 'safety', values: ['low', 'med', 'high'] }
]

const makeCarDecisionTree = (heuristic, depth) => ID3(trainingCars, attributes, heuristic, depth)

const car = () => {

  // console.dir(makeCarDecisionTree(heuristics[0], 3), { depth: null })
  // console.log(getLabel(testCars[0], makeCarDecisionTree(heuristics[0], 3)))
  // console.log(runTest(testCars, makeCarDecisionTree(heuristics[0], 6)))

  const testData = Object.entries(heuristics).reduce((data, [name, func]) => Object.assign(data, {
    [name]: {
      training: Array(6).fill(1).map((x,y)=>x+y).reduce((sum, i) => sum + runTest(trainingCars, makeCarDecisionTree(func, i)), 0) / 6,
      test: Array(6).fill(1).map((x,y)=>x+y).reduce((sum, i) => sum + runTest(testCars, makeCarDecisionTree(func, i)), 0) / 6
    }
  }), {})

  console.table(testData)
}

console.log('Part 2 - Question 2b - cars')
car()
