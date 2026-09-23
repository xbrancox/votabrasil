const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('🚀 Iniciando teste E2E do fluxo de votação ("Monte sua cédula")...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Acessar o app
    await page.goto('http://127.0.0.1:8080/app/', { waitUntil: 'networkidle' });
    console.log('✓ Página carregada');

    // 2. Clicar em "Votar agora"
    await page.click('button:has-text("Votar agora")');
    await page.waitForSelector('#f0.on', { timeout: 5000 });
    console.log('✓ Tela f0 (Domicílio e Explicação) visível');

    // 3. Clicar em "Continuar para montar cédula"
    await page.click('button:has-text("Continuar para montar cédula")');
    await page.waitForSelector('#f1.on', { timeout: 5000 });
    console.log('✓ Tela f1 (Monte sua cédula) visível');

    // 4. Clicar em "Escolher candidato" para Presidente
    // O primeiro botão de escolha na cédula
    const escolherBtns = await page.$$('.cargo-card .escolhido');
    console.log(`Encontrados ${escolherBtns.length} cargos na cédula.`);
    assert(escolherBtns.length === 5, 'Deveria haver 5 cargos na cédula');

    // Escolher candidato para cada cargo em loop
    for (let i = 0; i < 5; i++) {
      // Re-query buttons
      const btns = await page.$$('.cargo-card .escolhido');
      await btns[i].click();
      
      // Aguardar sheet abrir
      await page.waitForSelector('#cand-sheet.on', { timeout: 5000 });
      // Aguardar candidatos carregarem na lista
      await page.waitForSelector('#cand-list button.co', { timeout: 10000 });
      
      // Clicar no primeiro candidato da lista
      await page.click('#cand-list button.co:first-child');
      
      // Aguardar sheet fechar
      await page.waitForFunction(() => !document.getElementById('cand-sheet').classList.contains('on'), { timeout: 5000 });
      console.log(`✓ Candidato escolhido para o cargo ${i + 1}`);
    }

    // 5. Verificar se botão de revisar está habilitado e clicar
    const revisarBtn = await page.$('#btn-revisar');
    const isDisabled = await revisarBtn.isDisabled();
    assert(!isDisabled, 'Botão de revisar deveria estar habilitado após escolher 5 candidatos');
    
    await revisarBtn.click();
    await page.waitForSelector('#f2.on', { timeout: 5000 });
    console.log('✓ Tela f2 (Revise sua cédula) visível');

    // 6. Marcar checkbox de confirmação
    await page.click('#chk-confirmar-voto');
    
    // Clicar em avançar para explicação do mandato revogável
    await page.click('#btn-avancar-explicacao');
    await page.waitForSelector('#f3.on', { timeout: 5000 });
    console.log('✓ Tela f3 (Mandato revogável) visível');

    // 7. Clicar em "Entendi, gerar meu código"
    await page.click('#btn-gerar');
    await page.waitForSelector('#f4.on', { timeout: 10000 });
    console.log('✓ Tela f4 (Comprovante / Código gerado) visível');

    // 8. Verificar se o código de 20 dígitos apareceu
    const codigoText = await page.$eval('#cg', el => el.textContent.trim());
    console.log('🎉 Voto registrado com sucesso! Código gerado:', codigoText);
    assert(codigoText.length >= 19, 'Código gerado deve ter pelo menos 20 caracteres (com espaços)');

    console.log('✅ TESTE E2E CONCLUÍDO COM SUCESSO ABSOLUTO!');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ ERRO NO TESTE E2E:', err);
    await page.screenshot({ path: 'tests/screenshots/error.png', fullPage: true });
    await browser.close();
    process.exit(1);
  }
})();
