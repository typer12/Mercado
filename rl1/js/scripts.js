let currentQuestion = 1;
const totalQuestions = 5; // p1 to p5 are questions

function nextQuestion() {
    // Oculta a pergunta atual
    const currentDiv = document.getElementById('p' + currentQuestion);
    if (currentDiv) {
        currentDiv.style.display = 'none';
    }

    // Avança para a próxima etapa
    currentQuestion++;

    // Atualiza a barra de progresso (1 a 6 = 16.6% a 100%)
    let progressPercentage = Math.round((currentQuestion / 6) * 100);
    if (progressPercentage > 100) progressPercentage = 100;
    
    const progressDiv = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    if (progressDiv) progressDiv.style.width = progressPercentage + '%';
    if (progressText) progressText.innerText = progressPercentage + ' %';

    // Mostra a próxima tela
    if (currentQuestion <= totalQuestions) {
        const nextDiv = document.getElementById('p' + currentQuestion);
        if (nextDiv) nextDiv.style.display = 'block';
    } else {
        // Exibe a tela final (p6)
        const p6 = document.getElementById('p6');
        if (p6) p6.style.display = 'block';
        
        // Altera o botão "Próximo" para "Resgatar Recompensa"
        const nextBtn = document.getElementById('next-button');
        if (nextBtn) {
            nextBtn.innerText = 'Rodar Roleta';
            nextBtn.onclick = function() {
                window.location.href = '../roleta/';
            };
        }
    }
}
