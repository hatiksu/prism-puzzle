import { expect, test, type Page } from '@playwright/test'
import levels from '../src/game/levels.json' with { type: 'json' }

type Piece = { t: string; x: number; y: number; r?: 0 | 1; f?: boolean }
type Level = { id: number; pieces: Piece[]; solution: (0 | 1)[]; optimal: number }
const LEVELS = levels as Level[]

const win = (page: Page) => page.getByRole('dialog', { name: 'Уровень пройден' })
const pieceButton = (page: Page, p: Piece) => page.locator(`[role=button][aria-label*="строка ${p.y + 1}, столбец ${p.x + 1}"]`)

/** Детали, которые нужно повернуть из начальной позиции, чтобы прийти к сохранённому решению */
function solutionTaps(lv: Level): Piece[] {
  const rotatable = lv.pieces.filter((p) => (p.t === 'M' || p.t === 'S') && !p.f)
  return rotatable.filter((p, k) => p.r !== lv.solution[k])
}

async function solve(page: Page, lv: Level) {
  for (const p of solutionTaps(lv)) await pieceButton(page, p).click()
}

test('экран уровней: первый открыт, остальные закрыты', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Призма' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Уровень 1', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Уровень 2, закрыт' })).toBeDisabled()
})

test('решение за минимум ходов — три звезды, следующий уровень открывается и это запоминается', async ({ page }) => {
  const lv = LEVELS[0]
  await page.goto('./')
  await page.getByRole('button', { name: 'Уровень 1', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Уровень 1' })).toBeVisible()
  await solve(page, lv)
  await expect(win(page)).toBeVisible()
  await expect(page.getByTestId('stars')).toHaveAttribute('data-stars', '3')

  await page.getByRole('button', { name: 'К уровням' }).last().click()
  await expect(page.getByRole('button', { name: 'Уровень 1, звёзд: 3' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Уровень 2', exact: true })).toBeEnabled()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Уровень 2', exact: true })).toBeEnabled()
  await expect(page.getByText('★ 3 / 72')).toBeVisible()
})

test('лишние ходы — меньше звёзд', async ({ page }) => {
  const lv = LEVELS[0]
  await page.goto('./#1')
  // Два лишних поворота одной и той же детали туда-обратно
  const first = solutionTaps(lv)[0]
  await pieceButton(page, first).click()
  await pieceButton(page, first).click()
  await solve(page, lv)
  await expect(win(page)).toBeVisible()
  await expect(page.getByTestId('stars')).toHaveAttribute('data-stars', '2')
})

test('отмена хода и перезапуск', async ({ page }) => {
  const lv = LEVELS[0]
  await page.goto('./#1')
  const p = solutionTaps(lv)[0]
  const label = (await pieceButton(page, p).getAttribute('aria-label'))!
  await pieceButton(page, p).click()
  await expect(page.getByTestId('moves')).toHaveText('1')
  await expect(pieceButton(page, p)).not.toHaveAttribute('aria-label', label)

  await page.getByRole('button', { name: 'Отменить ход' }).click()
  await expect(pieceButton(page, p)).toHaveAttribute('aria-label', label)
  // Отмена тоже считается ходом — иначе звёзды можно было бы получить перебором
  await expect(page.getByTestId('moves')).toHaveText('2')

  await page.getByRole('button', { name: 'Начать заново' }).click()
  await expect(page.getByTestId('moves')).toHaveText('0')
})

test('уровень проходится, если следовать одним подсказкам', async ({ page }) => {
  await page.goto('./#1')
  for (let i = 0; i < 20; i++) {
    if (await win(page).isVisible()) break
    await page.getByRole('button', { name: 'Подсказка' }).click()
    const hinted = page.locator('[data-hint]')
    await expect(hinted).toHaveCount(1)
    await hinted.click()
  }
  await expect(win(page)).toBeVisible()
})

test('закрытый уровень по ссылке не открывается', async ({ page }) => {
  await page.goto('./#5')
  await expect(page.getByRole('heading', { name: 'Призма' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Уровень 5' })).toHaveCount(0)
})

test('зеркало поворачивается с клавиатуры', async ({ page }) => {
  const lv = LEVELS[0]
  await page.goto('./#1')
  const p = solutionTaps(lv)[0]
  const button = pieceButton(page, p)
  const label = (await button.getAttribute('aria-label'))!
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(button).not.toHaveAttribute('aria-label', label)
  await expect(page.getByTestId('moves')).toHaveText('1')
})

test('игра открывается без интернета после первого запуска', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Призма' })).toBeVisible()
  await context.setOffline(false)
})
