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

const ended = endPlayerTurn(played.nextState);
assert.ok(ended.report.events.some((event) => event.type === "cardFlow" && event.kind === "discard"));

const nextTurn = startNextPlayerTurn(ended.nextState);
assert.ok(nextTurn.report.events.some((event) => event.type === "cardFlow" && event.kind === "draw"));

console.log("engine self-check ok");
