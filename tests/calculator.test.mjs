import test from "node:test";
import assert from "node:assert/strict";
import { catToHuman, dogToHuman, yearsBetween, calendarAge, lifeStage } from "../dist/calculator.mjs";
test("cat anchors and interpolation follow the FelineVMA curve",()=>{assert.equal(catToHuman(1),15);assert.equal(catToHuman(2),24);assert.equal(catToHuman(10),56);assert.equal(catToHuman(.5),10)});
test("dog age changes by adult size after year two",()=>{assert.equal(dogToHuman(1,"small"),15);assert.equal(dogToHuman(2,"giant"),24);assert.equal(dogToHuman(10,"small"),56);assert.equal(Math.round(dogToHuman(10,"giant")),83)});
test("future dates are rejected",()=>{assert.equal(yearsBetween("2030-01-01",new Date("2029-01-01T12:00:00")),null)});
test("calendar age returns years, months and days",()=>{assert.deepEqual(calendarAge("2020-01-10",new Date("2026-03-15T12:00:00")),{years:6,months:2,days:5})});
test("large dogs reach senior stage earlier",()=>{assert.equal(lifeStage("dog",6.5,"large").key,"senior");assert.equal(lifeStage("dog",6.5,"small").key,"adult")});
