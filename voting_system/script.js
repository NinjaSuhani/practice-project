let hasVoted = {};
let voteCounts = [0, 0, 0, 0, 0]; // For 5 candidates
let currentVoter = "";

const candidates = ["Narendra Modi", "Rahul Gandhi", "Nitin Gadhkari", "Balasaheb Thakre", "Yogi Adityanath"];

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!user || !pass) {
    document.getElementById("loginError").innerText = "Please enter username and password.";
    return;
  }

  if (hasVoted[user]) {
    document.getElementById("loginError").innerText = "You have already voted.";
  } else {
    currentVoter = user;
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("votingSection").classList.remove("hidden");
    document.getElementById("voterName").innerText = user;
    displayCandidates();
  }
}

function displayCandidates() {
  const container = document.getElementById("candidateList");
  container.innerHTML = "";
  candidates.forEach((name, index) => {
    const btn = document.createElement("button");
    btn.className = "candidate-btn";
    btn.innerText = name;
    btn.onclick = () => castVote(index);
    container.appendChild(btn);
  });
}

function castVote(index) {
  if (!hasVoted[currentVoter]) {
    voteCounts[index]++;
    hasVoted[currentVoter] = true;
    document.getElementById("voteMsg").innerText = `Thank you for voting for ${candidates[index]}!`;
  } else {
    document.getElementById("voteMsg").innerText = "You have already voted.";
  }
}

function showResults() {
  document.getElementById("votingSection").classList.add("hidden");
  document.getElementById("resultsSection").classList.remove("hidden");

  const resultTable = document.getElementById("resultTable");
  resultTable.innerHTML = "<ul>" + candidates.map((c, i) => `<li>${c}: ${voteCounts[i]} votes</li>`).join('') + "</ul>";

  const maxVotes = Math.max(...voteCounts);
  const winnerIndices = voteCounts.map((v, i) => v === maxVotes ? i : -1).filter(i => i !== -1);
  const winnerText = winnerIndices.length === 1 ?
    `Winner: ${candidates[winnerIndices[0]]}` :
    `It's a tie between: ${winnerIndices.map(i => candidates[i]).join(", ")}`;

  resultTable.innerHTML += `<p><strong>${winnerText}</strong></p>`;
}

function goBack() {
  location.reload();
}
