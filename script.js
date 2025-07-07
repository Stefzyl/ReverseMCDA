let rowCount = 0;
let colCount = 0;


//Setup tables
function createInputCell(type = "text", placeholder = "") {
  const cell = document.createElement("td");
  const input = document.createElement("input");
  input.type = type;
  if (placeholder) input.placeholder = placeholder;
  cell.appendChild(input);
  return cell;
}

function setTableDimensions(requestedRows, requestedCols) {
  const targetRowCount = Math.max(2, requestedRows);
  const targetColCount = Math.max(2, requestedCols);

  const leftTbody = document.querySelector("#left-table tbody");
  const rightTbody = document.querySelector("#right-table tbody");
  const headerRow = document.getElementById("prototype-header");
  const radioRow = document.getElementById("prototype-select-row");

  // Current counts
  let currentRowCount = leftTbody.children.length;
  let currentColCount = headerRow.children.length;

  // === Adjust columns (prototypes) ===

  // Remove excess columns if needed
  while (currentColCount > targetColCount) {
    // Remove last radio button header cell
    radioRow.removeChild(radioRow.lastElementChild);

    // Remove last header input cell
    headerRow.removeChild(headerRow.lastElementChild);

    // Remove last cell in each right table row
    rightTbody.querySelectorAll("tr").forEach(row => {
      row.removeChild(row.lastElementChild);
    });

    currentColCount--;
  }

  // Add missing columns if needed
  while (currentColCount < targetColCount) {
    const c = currentColCount;

    // Add radio button cell
    const selectTh = document.createElement("th");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selectedPrototype";
    radio.value = c;
    selectTh.appendChild(radio);
    radioRow.appendChild(selectTh);

    // Add header input cell
    const headerTh = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Prototype ${c + 1}`;
    headerTh.appendChild(input);
    headerRow.appendChild(headerTh);

    // Add input cell to each right table row
    rightTbody.querySelectorAll("tr").forEach(row => {
      row.appendChild(createInputCell("number", "score"));
    });

    currentColCount++;
  }

  // === Adjust rows (criteria) ===

  // Remove excess rows if needed
  while (currentRowCount > targetRowCount) {
    // Remove last row left table (criteria)
    leftTbody.removeChild(leftTbody.lastElementChild);

    // Remove last row right table (scores)
    rightTbody.removeChild(rightTbody.lastElementChild);

    currentRowCount--;
  }

  // Add missing rows if needed
  while (currentRowCount < targetRowCount) {
    const r = currentRowCount;

    // Left table row: Criterion name + weight
    const leftRow = document.createElement("tr");
    leftRow.appendChild(createInputCell("text", `Criterion ${r + 1}`));
    leftRow.appendChild(createInputCell("number", "Weight"));
    leftTbody.appendChild(leftRow);

    // Right table row: input cells for each prototype
    const rightRow = document.createElement("tr");
    for (let c = 0; c < headerRow.children.length; c++) {
      rightRow.appendChild(createInputCell("number", "score"));
    }
    rightTbody.appendChild(rightRow);

    currentRowCount++;
  }

  // Update global counters
  rowCount = targetRowCount;
  colCount = targetColCount;

  updateColumnCountStyle();
  attachInputListeners();
  updateScoreTable()
}



function addCriterion() {
  setTableDimensions(rowCount + 1, colCount);
  // Update any related styles if necessary
  updateColumnCountStyle();
}

function addPrototype() {
  setTableDimensions(rowCount, colCount + 1);
  // Update any related styles if necessary
  updateColumnCountStyle();
}

function removeCriterion() {
  if (rowCount > 2) setTableDimensions(rowCount - 1, colCount);
  // Update any related styles if necessary
  updateColumnCountStyle();
}

function removePrototype() {
  if (colCount > 2) setTableDimensions(rowCount, colCount - 1);
  // Update any related styles if necessary
  updateColumnCountStyle();
}


function initializeTables(defaultRows = 2, defaultCols = 2) {
  setTableDimensions(defaultRows, defaultCols);
}

initializeTables(2, 2);



// not sure what this is for now 

function updateColumnCountStyle() {
  document.documentElement.style.setProperty('--col-count', colCount);
}

function clearTables() {
  // Clear left table body
  const leftBody = document.querySelector("#left-table tbody");
  if (leftBody) leftBody.innerHTML = "";

  // Clear right table body
  const rightBody = document.querySelector("#right-table tbody");
  if (rightBody) rightBody.innerHTML = "";

  // Clear prototype header row
  const prototypeHeader = document.getElementById("prototype-header");
  if (prototypeHeader) prototypeHeader.innerHTML = "";

  // Clear prototype select radio row
  const prototypeSelectRow = document.getElementById("prototype-select-row");
  if (prototypeSelectRow) prototypeSelectRow.innerHTML = "";

  // Reset counters if used globally
  rowCount = 0;
  colCount = 0;

  // Adding one will now create a new minimum of 2x2
  addCriterion();

  // Update any related styles if necessary
  updateColumnCountStyle();
}



function getConceptData() {
  // Get criteria names from left table
  const criteriaNames = [];
  const leftRows = document.querySelectorAll("#left-table tbody tr");
  for (let row of leftRows) {
    const input = row.cells[0].querySelector("input");
    criteriaNames.push(input ? input.value.trim() : "");
  }

  // Get concept names from right table header
  const conceptNames = [];
  const headerInputs = document.querySelectorAll("#prototype-header th input");
  for (let input of headerInputs) {
    conceptNames.push(input.value.trim() || "");
  }

  // Get concept scores (right table body)
  const concepts = [];
  const rightRows = document.querySelectorAll("#right-table tbody tr");
  for (let row of rightRows) {
    const rowScores = [];
    for (let cell of row.cells) {
      const val = parseFloat(cell.firstChild.value);
      rowScores.push(isNaN(val) ? 0 : val);
    }
    concepts.push(rowScores);
  }

  // Get weights from left table second column
  const weights = [];
  for (let row of leftRows) {
    const weightInput = row.cells[1].querySelector("input");
    weights.push(weightInput ? parseFloat(weightInput.value) || 0 : 0);
  }

  // Get selected prototype (desired concept) from radio buttons
  const selectedRadio = document.querySelector('input[name="selectedPrototype"]:checked');
  const selectedIndex = selectedRadio ? parseInt(selectedRadio.value) : null;
  const desiredConcept = selectedIndex !== null ? conceptNames[selectedIndex] : null;

  return { criteriaNames, conceptNames, concepts, weights, desiredConcept };
}


// python functions imported

function bestScore(conceptNames, concepts, weights) {
  // Transpose from [criterion][concept] to [concept][criterion]
  const transposed = conceptNames.map((_, cIdx) =>
    concepts.map(row => row[cIdx])
  );

  const scores = transposed.map((conceptScores) => {
    return conceptScores.reduce((sum, val, i) => sum + val * weights[i], 0);
  });

  const indexMax = scores.indexOf(Math.max(...scores));

  const sorted = [...scores]
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score);

  const diff = sorted.length > 1 ? sorted[0].score - sorted[1].score : 0;

  return {
    bestConcept: conceptNames[indexMax],
    scoreGap: diff
  };
}



function singleDelta(criteriaNames, conceptNames, concepts, weights, desiredConcept, epsilon = 0.01, maxIterations = 100) {
  if (!conceptNames.includes(desiredConcept)) {
    return { status: "noDesiredConcept" };
  }

  const baseResult = bestScore(conceptNames, concepts, weights);
  if (baseResult.bestConcept === desiredConcept && baseResult.scoreGap > epsilon) {
    return {
      status: "alreadyOptimal",
      gap: baseResult.scoreGap
    };
  }

  const results = [];

  // Try adjusting weights
  for (let i = 0; i < weights.length; i++) {
    for (let target of [1, 0]) {
      const tempWeights = [...weights];
      tempWeights[i] = target;

      let test = bestScore(conceptNames, concepts, tempWeights);
      if (test.bestConcept === desiredConcept && test.scoreGap > epsilon) {
        const step = (tempWeights[i] - weights[i]) / maxIterations;
        const trialWeights = [...weights];

        for (let n = 1; n <= maxIterations; n++) {
          trialWeights[i] += step;
          const testResult = bestScore(conceptNames, concepts, trialWeights);

          if (testResult.bestConcept === desiredConcept && testResult.scoreGap > epsilon) {
            const delta = trialWeights[i] - weights[i];
            results.push(`Change weight for criterion "${criteriaNames[i]}" by ${delta.toFixed(2)}`);
            break;
          }
        }
      }
    }
  }

  // Try adjusting scores
  for (let conceptIdx = 0; conceptIdx < concepts.length; conceptIdx++) {
    for (let critIdx = 0; critIdx < concepts[conceptIdx].length; critIdx++) {
      for (let target of [1, 0]) {
        const tempConcepts = concepts.map(row => [...row]);
        tempConcepts[conceptIdx][critIdx] = target;

        let test = bestScore(conceptNames, tempConcepts, weights);
        if (test.bestConcept === desiredConcept && test.scoreGap > epsilon) {
          const step = (tempConcepts[conceptIdx][critIdx] - concepts[conceptIdx][critIdx]) / maxIterations;
          const trialConcepts = concepts.map(row => [...row]);

          for (let n = 1; n <= maxIterations; n++) {
            trialConcepts[conceptIdx][critIdx] += step;
            const testResult = bestScore(conceptNames, trialConcepts, weights);

            if (testResult.bestConcept === desiredConcept && testResult.scoreGap > epsilon) {
              const delta = trialConcepts[conceptIdx][critIdx] - concepts[conceptIdx][critIdx];
              results.push(`Change the score of concept "${conceptNames[conceptIdx]}" at criterion "${criteriaNames[critIdx]}" by ${delta.toFixed(2)}`);
              break;
            }
          }
        }
      }
    }
  }

  return results.length
    ? { status: "found", results: [...new Set(results)] }
    : { status: "notFound" };
}

function doubleDelta(criteriaNames, conceptNames, concepts, weights, desiredConcept, epsilon = 0.01, maxIterations = 100) {
  if (!conceptNames.includes(desiredConcept)) {
    return `${desiredConcept} is NOT a valid desired concept name.`;
  }

  const desiredIdx = conceptNames.indexOf(desiredConcept);
  const numConcepts = concepts.length;
  const numCriteria = weights.length;

  if (!Array.isArray(concepts[0]) || concepts[0].length !== numCriteria) {
    return "Invalid concept score matrix dimensions.";
  }

  const results = [];
  const deepCopy = obj => JSON.parse(JSON.stringify(obj));

  const baseResult = bestScore(conceptNames, concepts, weights);
  if (baseResult.bestConcept === desiredConcept && baseResult.scoreGap > epsilon) {
    return `The desired concept already outscores the others by ${baseResult.scoreGap.toFixed(2)}.`;
  }

  for (let wIdx = 0; wIdx < numCriteria; wIdx++) {
    for (let weightTarget of [1, 0]) {
      const tempWeights = [...weights];
      tempWeights[wIdx] = weightTarget;

      for (let cIdx = 0; cIdx < numConcepts; cIdx++) {
        for (let critIdx = 0; critIdx < numCriteria; critIdx++) {
          const tempConcepts = deepCopy(concepts);
          tempConcepts[cIdx][critIdx] = (cIdx === desiredIdx) ? 1 : 0;

          const tempResult = bestScore(conceptNames, tempConcepts, tempWeights);
          let bestDeltaWeight = null;
          let bestDeltaScore = null;
          let minTotalChange = Infinity;

          if (tempResult.bestConcept === desiredConcept && tempResult.scoreGap > epsilon) {
            const weightStep = (tempWeights[wIdx] - weights[wIdx]) / maxIterations;
            const scoreStep = (tempConcepts[cIdx][critIdx] - concepts[cIdx][critIdx]) / maxIterations;

            for (let ws = 1; ws <= maxIterations; ws++) {
              const testWeights = [...weights];
              testWeights[wIdx] = weights[wIdx] + ws * weightStep;

              for (let ss = 1; ss <= maxIterations; ss++) {
                const testConcepts = deepCopy(concepts);
                testConcepts[cIdx][critIdx] = concepts[cIdx][critIdx] + ss * scoreStep;

                const testResult = bestScore(conceptNames, testConcepts, testWeights);

                if (testResult.bestConcept === desiredConcept && testResult.scoreGap > epsilon) {
                  const deltaW = testWeights[wIdx] - weights[wIdx];
                  const deltaS = testConcepts[cIdx][critIdx] - concepts[cIdx][critIdx];
                  const total = Math.abs(deltaW) + Math.abs(deltaS);

                  if (total < minTotalChange) {
                    bestDeltaWeight = deltaW;
                    bestDeltaScore = deltaS;
                    minTotalChange = total;
                  }
                }
              }
            }
          }

          if (bestDeltaWeight !== null && bestDeltaScore !== null) {
            results.push(`Change weight for criterion "${criteriaNames[wIdx]}" by ${bestDeltaWeight.toFixed(2)}`);
            results.push(`Change the score of concept "${conceptNames[cIdx]}" at criterion "${criteriaNames[critIdx]}" by ${bestDeltaScore.toFixed(2)}`);
          }
        }
      }
    }
  }

  if (results.length > 0) {
    return [...new Set(results)];
  } else {
    return "No double delta result found. Please try adjusting your criteria or concepts.";
  }
}

// === Run reverse optimization ===
function runReverse() {

  const output = document.getElementById("reverse-output");

  if (!validateInputs()) {
    output.innerText = "Please fill in all input fields before running the calculation.";
    return;
  }
  const { criteriaNames, conceptNames, concepts, weights, desiredConcept } = getConceptData();
  const epsilon = 0.01;
  const maxIterations = 100;


  const single = singleDelta(criteriaNames, conceptNames, concepts, weights, desiredConcept, epsilon, maxIterations);

  if (single.status === "noDesiredConcept") {
    console.log("singleDelta result:", single);
    output.innerText = `Please select a desired concept with the radial buttons above the right table.`;
    return;
  }

  if (single.status === "alreadyOptimal") {
    console.log("singleDelta result:", single);
    output.innerText = `The desired concept already outscores the others by ${single.gap.toFixed(2)}.`;
    return;
  }

  if (single.status === "found") {
    output.innerText = "\nResult(s) with one change found! Your possible solution(s) are printed below:\n\n";
    single.results.forEach((res, i) => {
      output.innerText += res + "\n";
      if (i !== single.results.length - 1) output.innerText += "Or:\n";
    });
    return;
  }

  // Otherwise: notFound — try double delta
  output.innerText = "Optimizing for your desired concept is not doable with a single change. Now trying to find a result with two changes:\n\n";

  const double = doubleDelta(criteriaNames, conceptNames, concepts, weights, desiredConcept, epsilon, maxIterations);

  if (typeof double === "string") {
    output.innerText += double;
  } else {
    output.innerText += "\nResult(s) with two changes found! Your possible solutions are printed below:\n\n";
    double.forEach((res, i) => {
      output.innerText += res + "\n";
      if (i % 2 === 1 && i !== double.length - 1) output.innerText += "Or:\n";
    });
  }
}

//Make sure table is filled in before running reverse optimization
function validateInputs() {
  const inputs = document.querySelectorAll("#left-table input, #right-table input");
  let allFilled = true;

  inputs.forEach(input => {
    if (input.value.trim() === "") {
      input.style.border = "2px solid red";  // highlight
      allFilled = false;
    } else {
      input.style.border = "";  // reset if filled
    }
  });

  return allFilled;
}

function saveState() {
  // Get all core data from getConceptData
  const { criteriaNames, conceptNames, concepts, weights, desiredConcept } = getConceptData();

  // Build a state object for saving
  const state = {
    criteriaNames,
    weights,
    conceptNames,
    concepts,
    desiredConcept
  };

  // Convert to JSON and create a downloadable file
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Create a temporary <a> element to download the file
  const a = document.createElement("a");
  a.href = url;
  a.download = "saved_state.json";

  // Append to DOM, trigger click, then clean up
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Release the blob URL
  URL.revokeObjectURL(url);
}
function loadStateFromFile(input) {
  if (!input.files || input.files.length === 0) {
    console.warn("No file selected");
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      loadStateFromJSON(data);
      setStatus("Preset loaded successfully.");
    } catch (err) {
      console.error("JSON parsing error:", err);
      setStatus("Error: Invalid JSON file.");
    }
  };

  reader.onerror = function() {
    console.error("File reading error");
    setStatus("Error: Unable to read file.");
  };

  reader.readAsText(file);

  // Reset file input value so the same file can be loaded again if needed
  input.value = "";
}


function loadStateFromFile(input) {
  if (!input.files || input.files.length === 0) {
    console.warn("No file selected");
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      console.log("Loaded JSON data:", data);  // <--- This logs your data
      // You can call your load function here if you want
      // loadStateFromJSON(data);
      loadStateFromJSON(data);
    } catch (err) {
      console.error("JSON parsing error:", err);
    }
  };

  reader.onerror = function() {
    console.error("File reading error");
  };

  reader.readAsText(file);

  // Reset input so same file can be loaded again if needed
  input.value = "";
}

function loadStateFromJSON(data) {
  clearTables();
  setTableDimensions(data.criteriaNames.length, data.conceptNames.length);

  // Fill criteria names and weights
  const leftRows = document.querySelectorAll("#left-table tbody tr");
  data.criteriaNames.forEach((name, i) => {
    leftRows[i].cells[0].querySelector("input").value = name;
    leftRows[i].cells[1].querySelector("input").value = data.weights[i];
  });

  // Fill concept names
  const headerInputs = document.querySelectorAll("#prototype-header th input");
  data.conceptNames.forEach((name, i) => {
    headerInputs[i].value = name;
  });

  // Fill scores matrix
  const rightRows = document.querySelectorAll("#right-table tbody tr");
  data.concepts.forEach((scores, i) => {
    scores.forEach((score, j) => {
      rightRows[i].cells[j].querySelector("input").value = score;
    });
  });

  // Set desired concept radio button by matching index
  const desiredIndex = data.conceptNames.indexOf(data.desiredConcept);
  const radioButtons = document.querySelectorAll('input[name="selectedPrototype"]');
  radioButtons.forEach(radio => {
    radio.checked = (parseInt(radio.value, 10) === desiredIndex);
  });
  updateScoreTable();
  attachInputListeners()
}


// Call this after your tables are built or updated
function attachInputListeners() {
  // Prototype name inputs in header
  const headerInputs = document.querySelectorAll("#prototype-header th input");
  headerInputs.forEach(input => {
    input.addEventListener("input", updateScoreTable);
  });

  // Score inputs in right table (tbody)
  const scoreInputs = document.querySelectorAll("#right-table tbody input");
  scoreInputs.forEach(input => {
    input.addEventListener("input", updateScoreTable);
  });

  // Weight inputs in left table (2nd td input in each row)
  const weightInputs = document.querySelectorAll("#left-table tbody tr td:nth-child(2) input");
  weightInputs.forEach(input => {
    input.addEventListener("input", updateScoreTable);
  });
}

// Updates the vertical summary score table
function updateScoreTable() {
  const summaryTbody = document.querySelector("#score-summary tbody");
  summaryTbody.innerHTML = ""; // Clear previous rows

  const headerInputs = document.querySelectorAll("#prototype-header th input"); // prototypes
  const scoreRows = document.querySelectorAll("#right-table tbody tr");
  const weightInputs = document.querySelectorAll("#left-table tbody tr td:nth-child(2) input");

  headerInputs.forEach((headerInput, colIdx) => {
    let totalScore = 0;

    scoreRows.forEach((row, rowIdx) => {
      const scoreInput = row.cells[colIdx].querySelector("input");
      const score = parseFloat(scoreInput?.value) || 0;
      const weight = parseFloat(weightInputs[rowIdx]?.value) || 0;

      totalScore += score * weight;
    });

    const tr = document.createElement("tr");

    const nameTd = document.createElement("td");
    nameTd.textContent = headerInput.value.trim() || `Prototype ${colIdx + 1}`;
    nameTd.style.paddingRight = "10px";

    const scoreTd = document.createElement("td");
    scoreTd.textContent = totalScore.toFixed(2);

    tr.appendChild(nameTd);
    tr.appendChild(scoreTd);
    summaryTbody.appendChild(tr);
  });
}
