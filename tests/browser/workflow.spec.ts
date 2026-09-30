import { test, expect } from '@playwright/test';
test('layer modes, immutable material revisions and persisted plans', async ({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByText('IndexedDB ready', {exact:false})).toBeVisible();
 await expect(page.getByText('29.661 mm',{exact:true})).toBeVisible();
 await page.getByLabel('Cathode sheets per stack',{exact:true}).fill('35');await expect(page.getByText('28.334 mm',{exact:true})).toBeVisible();
 await page.getByLabel('Layer mode').selectOption('automatic');await expect(page.getByLabel('Cathode sheets per stack',{exact:true})).toHaveValue('34');await expect(page.getByText('Fits at worst case',{exact:true})).toBeVisible();
 await page.getByLabel('Plan name',{exact:true}).fill('Browser verified plan');await page.getByRole('button',{name:'Save plan revision',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved locally');
 await page.reload();await expect(page.getByRole('heading',{name:'Browser verified plan'})).toBeVisible();await expect(page.getByLabel('Layer mode')).toHaveValue('automatic');
 await page.getByRole('button',{name:/^Materials/}).click();await page.getByRole('row').filter({hasText:'154.0000'}).getByRole('button',{name:'Create next revision'}).click();
 await page.getByLabel('Specific capacity Cs').fill('160');await page.getByRole('button',{name:'Save new revision',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.getByRole('row').filter({hasText:'160.0000'})).toContainText('r2');
 await page.getByRole('button',{name:'Cell design workspace',exact:true}).click();await expect(page.getByLabel('Cathode electrode revision')).toContainText('r1');await page.getByLabel('Anode electrode revision').selectOption('electrode-a1');await expect(page.getByLabel('Anode electrode revision')).toHaveValue('electrode-a1');
 await expect(page.getByLabel('Cathode sheets per stack',{exact:true})).toHaveValue('34');
 await page.screenshot({path:test.info().outputPath('desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:test.info().outputPath('mobile.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();expect(errors).toEqual([]);
});
