import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEvidenceCatalog } from '../src/paper-evidence.js'
import { loadPaperExplainerSkill, validateTeachingPlan } from '../src/paper-skill.js'
import { evidencePaper, teachingPlanFixture } from '../test-support/explanation-fixture.js'

const catalog = createEvidenceCatalog(evidencePaper)
test('loads the discoverable skill and its application resources from the packaged relative location', async () => {
  const skill = await loadPaperExplainerSkill()
  assert.equal(typeof skill, 'string')
  assert(skill.length > 100)
  assert.equal(await loadPaperExplainerSkill(), skill)
})
test('teaching plans require grounded concepts and a complete same-case comparison before drafting', () => {
  assert.equal(validateTeachingPlan(teachingPlanFixture(), catalog).concepts.length, 5)
  const invalid = teachingPlanFixture(); invalid.concepts[0].example = ''
  assert.throws(() => validateTeachingPlan(invalid, catalog), error => error.code === 'explanation-invalid')
  const source = teachingPlanFixture(); source.concepts[0].references[0].sourceId = 'p99-s99'
  assert.throws(() => validateTeachingPlan(source, catalog), error => error.code === 'explanation-invalid')
  const noOutput = teachingPlanFixture(); noOutput.example.output = ''
  assert.throws(() => validateTeachingPlan(noOutput, catalog), error => error.code === 'explanation-invalid')
  const repeated = teachingPlanFixture(); repeated.visuals = [{ type: 'chart', chapterId: 'results', question: 'A' }, { type: 'chart', chapterId: 'results', question: 'B' }]
  assert.throws(() => validateTeachingPlan(repeated, catalog), error => error.code === 'explanation-invalid')
})
