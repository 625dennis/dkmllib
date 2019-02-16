const entropy = examples => {
  const { labelCounts, total } = examples.reduce(({ labelCounts, total }, { label }) => {
    if(labelCounts[label])
      labelCounts[label]++
    else
      labelCounts[label] = 1

    total++

    return { labelCounts, total }
  }, { labelCounts: {}, total: 0 })

  const probs = Object.entries(labelCounts).reduce((probs, [label, count]) => {
    probs[label] = count / total
    return probs
  }, {})

  return -Object.values(probs).reduce((entropy, prob) => entropy + prob * Math.log(prob), 0)
}

const giniIndex = examples => {
  const { labelCounts, total } = examples.reduce(({ labelCounts, total }, { label }) => {
    if(labelCounts[label])
      labelCounts[label]++
    else
      labelCounts[label] = 1

    total++

    return { labelCounts, total }
  }, { labelCounts: {}, total: 0 })

  const probs = Object.entries(labelCounts).reduce((probs, [label, count]) => {
    probs[label] = count / total
    return probs
  }, {})

  return 1 - Object.values(probs).reduce((entropy, prob) => entropy + prob * prob, 0)
}

const majorityError = examples => {
  const { labelCounts, total } = examples.reduce(({ labelCounts, total }, { label }) => {
    if(labelCounts[label])
      labelCounts[label]++
    else
      labelCounts[label] = 1

    total++

    return { labelCounts, total }
  }, { labelCounts: {}, total: 0 })

  const max = Object.values(labelCounts).reduce((max, count) => count > max ? count : max, 0)

  return total !== 0 ? (total - max) / total : 0
}

const gainF = (examples, { name, values }, heuristic) => heuristic(examples) - values.reduce(
  (sum, value) => {
    const examplesWithValue = examples.filter(example => example[name] === value)
    return examplesWithValue.length / examples.length * heuristic(examplesWithValue)
  }, 0
)

const maxGain = (examples, attributes, heuristic) => {
  const { bestAttrib: { name } } = attributes.reduce(({ bestAttrib, gain }, attrib) => {
    const newGain = gainF(examples, attrib, heuristic)
    return newGain > gain ? { bestAttrib: attrib, gain: newGain } : { bestAttrib, gain }
  }, { gain: -1 })

  return name
}

function ID3(examples, attributes, heuristic = entropy, depth = 6) {
  /////////////////////// BASE CASE
  const labelCounts = examples.reduce((labelCounts, example) => {
    const { label } = example

    if(labelCounts[label]) {
      labelCounts[label]++
    } else {
      labelCounts[label] = 1
    }

    return labelCounts
  }, {})

  const labels = Object.keys(labelCounts)

  const { mostCommon } = Object.entries(labelCounts).reduce(({ mostCommon, max }, [label, count]) => count > max ? { mostCommon: label, max: count } : { mostCommon, max }, { max: 0 })

  if(depth === 0) {
    return { label: mostCommon }
  }

  if(labels.length === 1) {
    const [label] = labels
    return { label }
  }

  if(attributes.length === 0) {
    return { label: mostCommon }
  }
  ///////////////////////

  const attribute = maxGain(examples, attributes, heuristic)
  const root = { attribute, nodes: {} }

  const possibleValues = attributes.find(({ name }) => name === attribute).values

  const newAttributes = attributes.filter(({ name }) => name !== attribute)

  possibleValues.forEach(value => {
    const examplesWithValue = examples.filter(example => example[attribute] === value)

    if(examplesWithValue.length === 0) {
      root.nodes[value] = { label: mostCommon }
    } else {
      root.nodes[value] = ID3(examplesWithValue, newAttributes, heuristic, depth - 1)
    }
  })

  return root
}

module.exports = {
  ID3,
  heuristics: {
    informationGain: entropy,
    majorityError,
    giniIndex
  }
}
