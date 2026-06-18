import assert from "node:assert/strict";
import { createRunState, getCurrentLayer, getCurrentNode, makeEncounterFromNode } from "./navigation.js";
import { endPlayerTurn, openEncounter, playCard, startNextPlayerTurn } from "./engine.js";

const run = createRunState({ classId: "enoki" });
const state = openEncounter(run, getCurrentLayer(run), makeEncounterFromNode(getCurrentNode(run), getCurrentLayer(run)));
const attack = state.player.hand.find((card) => card.suite === "attack") || state.player.deck.find((card) => card.suite === "attack");

assert.ok(attack, "starter hand should contain an attack in this self-check");
if (!state.player.hand.some((card) => card.instanceId === attack.instanceId)) state.player.hand.push(attack);

const played = playCard(state, attack.instanceId, state.enemies[0].instanceId);
assert.ok(played.report.events.some((event) => event.type === "actorAction" && event.actorId === "player"));
assert.ok(played.report.events.some((event) => event.type === "cardFlow" && event.kind === "play"));
assert.ok(played.report.events.some((event) => event.type === "hitFx" && event.effects.includes("hit")));

function playAttackIntoEnemyBlock(block) {
  const nextRun = createRunState({ classId: "enoki" });
  const nextState = openEncounter(
    nextRun,
    getCurrentLayer(nextRun),
    makeEncounterFromNode(getCurrentNode(nextRun), getCurrentLayer(nextRun)),
  );
  const nextAttack =
    nextState.player.hand.find((card) => card.suite === "attack") ||
    nextState.player.deck.find((card) => card.suite === "attack");
  if (!nextState.player.hand.some((card) => card.instanceId === nextAttack.instanceId)) {
    nextState.player.hand.push(nextAttack);
  }
  nextState.enemies[0].block = block;
  return playCard(nextState, nextAttack.instanceId, nextState.enemies[0].instanceId).report.events.find(
    (event) => event.type === "hitFx",
  );
}

assert.deepEqual(playAttackIntoEnemyBlock(10).effects, ["armor"]);
assert.deepEqual(playAttackIntoEnemyBlock(3).effects, ["break", "hit"]);

const ended = endPlayerTurn(played.nextState);
assert.ok(ended.report.events.some((event) => event.type === "cardFlow" && event.kind === "discard"));

const nextTurn = startNextPlayerTurn(ended.nextState);
assert.ok(nextTurn.report.events.some((event) => event.type === "cardFlow" && event.kind === "draw"));

console.log("engine self-check ok");
