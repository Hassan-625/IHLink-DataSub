import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesPlanCategory } from '../src/lib/dataPlanFilters.ts';
test('monthly bundles remain monthly regardless of service type', () => {
  for (const type of ['sme', 'gifting', 'corporate_gifting']) {
    for (const validity of ['30 days', '1 Month', '4 weeks']) {
      assert.equal(matchesPlanCategory({plan_category:type, validity_label:validity}, 'monthly'), true);
      assert.equal(matchesPlanCategory({plan_category:type, validity_label:validity}, type), true);
    }
  }
});
test('duration boundaries and provider labels', () => {
  for (const [validity, category] of [['24 hours','daily'],['3 days','daily'],['7 days','weekly'],['14 days','weekly'],['28 days','monthly'],['60 days','multi_month'],['2 months','multi_month'],['1 year','multi_month']]) {
    assert.equal(matchesPlanCategory({plan_category:'gifting',validity_label:validity}, category), true);
  }
});
test('unknown and unlimited labels do not imply a duration', () => {
  for (const validity of [null,'No expiry','Provider-defined','0 days']) {
    assert.equal(matchesPlanCategory({plan_category:'sme',validity_label:validity}, 'monthly'), false);
    assert.equal(matchesPlanCategory({plan_category:'sme',validity_label:validity}, 'sme'), true);
  }
  assert.equal(matchesPlanCategory({plan_category:'monthly',validity_label:null}, 'monthly'), true);
  assert.equal(matchesPlanCategory({plan_category:'sme',validity_label:null}, 'all'), true);
});
