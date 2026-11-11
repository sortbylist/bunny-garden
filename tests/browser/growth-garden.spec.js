import { test, expect } from '@playwright/test';
import { chineseTopics } from '../../src/chinese-topics.js';
import { chooseMode } from './helpers.js';

test('语文各页都有成长花园，只显示本页错题本和进度', async ({ page }) => {
  await page.goto('/');
  const garden = page.locator('.growth-card');
  const review = garden.getByRole('button', { name: /错题本/ });
  await expect(review).toHaveCount(1);
  await expect(review).toHaveText('拼音错题本（0）');
  await expect(review).toBeDisabled();
  await expect(page.locator('.my-menu-content')).not.toContainText('汉字错题本');
  await chooseMode(page, 'rules');
  await page.locator('[data-action="skip"]').click();
  await expect(review).toHaveText('拼音错题本（1）');
  await expect(review).toBeEnabled();
  await review.click();
  await expect(page.locator('.learning-main>.section-title')).toContainText('错题本');

  await page.getByRole('tab', { name: '汉字笔画与结构' }).click();
  await expect(garden).toHaveCount(1);
  await expect(review).toHaveText('汉字错题本（0）');
  await expect(review).toBeDisabled();
  await page.locator('[data-action="hz-known"]').click();
  await expect(garden.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  const buttonStyle = await review.evaluate(element => {
    const style = getComputedStyle(element);
    return { border: style.border, radius: style.borderRadius, background: style.backgroundColor };
  });
  await page.locator('[data-action="hz-start"][data-id="all"]').click();
  await page.locator('[data-action="hz-skip"]').click();
  await expect(review).toHaveText('汉字错题本（1）');
  await review.click();
  await expect(page.locator('.hz-quiz')).toBeVisible();

  for (const topic of chineseTopics) {
    await page.getByRole('tab', { name: topic.name, exact: true }).click();
    await expect(garden).toHaveCount(1);
    await expect(review).toHaveText(`${topic.name}错题本（0）`);
    await expect(review).toBeDisabled();
    await expect(garden.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    await expect(garden.getByRole('progressbar')).toHaveAttribute('aria-valuemax', String(topic.lessons.length));
    expect(await review.evaluate(element => {
      const style = getComputedStyle(element);
      return { border: style.border, radius: style.borderRadius, background: style.backgroundColor };
    })).toEqual(buttonStyle);
    await page.locator('[data-action="ct-known"]').click();
    await expect(garden.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    await page.locator('[data-action="ct-start"][data-id="all"]').click();
    await page.locator('[data-action="ct-skip"]').click();
    await expect(review).toHaveText(`${topic.name}错题本（1）`);
    await review.click();
    await expect(page.locator('.ct-quiz')).toBeVisible();
  }
  await page.getByRole('tab', { name: '拼音学习' }).click();
  await expect(review).toHaveText('拼音错题本（1）');
  await page.reload();
  await expect(review).toHaveText('拼音错题本（1）');
});

test('自然拼读的个人入口移入成长花园，错题与语文隔离且清零后禁用', async ({ page }) => {
  await page.goto('/');
  await page.locator('.subjects [data-id="english"]').click();
  const garden = page.locator('.growth-card');
  const review = garden.locator('[data-id="review"]');
  await expect(garden).toContainText('我的成长花园');
  await expect(page.locator('.ph-modes button')).toHaveCount(7);
  await expect(page.locator('.ph-modes')).not.toContainText('错题');
  await expect(page.locator('.ph-modes')).not.toContainText('我的收藏');
  await expect(page.locator('.ph-modes')).not.toContainText('学习记录');
  await expect(review).toHaveText('错题本（0）');
  await expect(review).toBeDisabled();
  await page.locator('[data-action="ph-favorite"]').click();
  await page.locator('[data-action="ph-known"]').click();
  await expect(garden.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await garden.locator('[data-id="favorites"]').click();
  await expect(page.locator('.ph-word')).toHaveText('map');
  await page.locator('.ph-modes [data-id="rules"]').click();
  await page.locator('[data-action="ph-answer"][data-value="zip"]').click();
  await expect(review).toHaveText('错题本（1）');
  await expect(review).toBeEnabled();
  await page.locator('.subjects [data-id="chinese"]').click();
  await expect(garden.getByRole('button', { name: /错题本/ })).toHaveText('拼音错题本（0）');
  await expect(garden.getByRole('button', { name: /错题本/ })).toBeDisabled();
  await page.locator('.subjects [data-id="english"]').click();
  await review.click();
  await page.locator('[data-action="ph-answer"][data-value="zed"]').click();
  await expect(review).toHaveText('错题本（0）');
  await expect(review).toBeDisabled();
  await garden.locator('[data-id="records"]').click();
  await expect(page.locator('.ph-section-title h2')).toHaveText('学习记录');
  await expect(page.locator('.ph-main [data-id="review"]')).toBeDisabled();
  await expect(garden).toBeVisible();
});
