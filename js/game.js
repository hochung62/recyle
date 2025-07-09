class AnipangGame {    constructor() {
        this.boardSize = 6;
        this.score = 0;
        this.combo = 0;
        this.isPlaying = false;
        this.selectedBlock = null;
        this.blockTypes = ['🪣', '📄', '🍕', '🧻', '🧢', '⚽'];
        this.currentStage = 1;
        this.matchCount = 0;
        this.shuffleCount = 2; // 스테이지당 흔들기 횟수// 매칭 성공 횟수
        this.stages = [
            { time: 60, target: 10 },  // 10번 매칭
            { time: 80, target: 15 },  // 15번 매칭
            { time: 100, target: 20 }, // 20번 매칭
            { time: 120, target: 25 }, // 25번 매칭
            { time: 140, target: 30 }, // 30번 매칭
            { time: 160, target: 35 }, // 35번 매칭
            { time: 180, target: 40 }, // 40번 매칭
            { time: 200, target: 45 }, // 45번 매칭
            { time: 120, target: 50 }, // 50번 매칭
            { time: 140, target: 55 }  // 55번 매칭
        ];
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeBoard();
        this.setupKeyboardControls();
    }    bindEvents() {
        $('#start-button').on('click', () => this.startGame());
        $('#retry-button').on('click', () => this.startGame());
        $('#shuffle-button').on('click', () => this.shuffleBoard());
        
        // 블록 클릭 이벤트
        $('#game-board').on('click', '.block', (e) => {
            const $clickedBlock = $(e.currentTarget);
            
            // 이미 선택된 블록이 있는 경우
            if (this.selectedBlock) {
                const selectedX = parseInt(this.selectedBlock.attr('data-x'));
                const selectedY = parseInt(this.selectedBlock.attr('data-y'));
                const clickedX = parseInt($clickedBlock.attr('data-x'));
                const clickedY = parseInt($clickedBlock.attr('data-y'));
                
                // 인접한 블록인지 확인
                const isAdjacent = Math.abs(selectedX - clickedX) + Math.abs(selectedY - clickedY) === 1;
                
                if (isAdjacent) {
                    // 인접한 블록이면 교환
                    this.swapBlocks(this.selectedBlock, $clickedBlock);
                    this.selectedBlock.removeClass('selected');
                    this.selectedBlock = null;
                } else {
                    // 인접하지 않은 블록이면 새로운 블록을 선택
                    this.selectedBlock.removeClass('selected');
                    $clickedBlock.addClass('selected');
                    this.selectedBlock = $clickedBlock;
                }
            } else {
                // 첫 번째 블록 선택
                $clickedBlock.addClass('selected');
                this.selectedBlock = $clickedBlock;
            }
        });
    }

    setupKeyboardControls() {
        let currentPos = { x: 0, y: 0 };
        let isSpacePressed = false;

        $(document).on('keydown', (e) => {
            if (!this.isPlaying) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowRight':
                case 'ArrowUp':
                case 'ArrowDown':
                    e.preventDefault();
                    this.handleArrowKey(e.key, currentPos, isSpacePressed);
                    break;
                case ' ':
                    e.preventDefault();
                    isSpacePressed = true;
                    this.highlightBlock(currentPos);
                    break;
                case 'Escape':
                    this.pauseGame();
                    break;
            }
        });

        $(document).on('keyup', (e) => {
            if (e.key === ' ') {
                isSpacePressed = false;
            }
        });
    }

    handleArrowKey(key, pos, isSpacePressed) {
        const oldPos = { ...pos };
        
        switch (key) {
            case 'ArrowLeft': pos.x = Math.max(0, pos.x - 1); break;
            case 'ArrowRight': pos.x = Math.min(this.boardSize - 1, pos.x + 1); break;
            case 'ArrowUp': pos.y = Math.max(0, pos.y - 1); break;
            case 'ArrowDown': pos.y = Math.min(this.boardSize - 1, pos.y + 1); break;
        }

        if (isSpacePressed) {
            this.trySwapBlocks(
                this.getBlockAt(oldPos.x, oldPos.y),
                this.getDirectionFromPositions(oldPos, pos)
            );
        } else {
            this.highlightBlock(pos);
        }
    }

    highlightBlock(pos) {
        $('.block').removeClass('selected');
        this.getBlockAt(pos.x, pos.y).addClass('selected');
    }

    getBlockAt(x, y) {
        return $(`.block[data-x="${x}"][data-y="${y}"]`);
    }

    getDirectionFromPositions(from, to) {
        if (from.x < to.x) return 'right';
        if (from.x > to.x) return 'left';
        if (from.y < to.y) return 'down';
        if (from.y > to.y) return 'up';
        return '';
    }    startGame() {
        this.score = 0;
        this.currentStage = 1;
        this.combo = 0;
        this.matchCount = 0;
        this.shuffleCount = 2;
        this.isPlaying = true;
        
        // 흔들기 버튼 초기화
        $('#shuffle-button')
            .removeClass('shuffle-disabled')
            .addClass('shuffle-active')
            .text('흔들기 2번');
            
        this.updateScore();
        this.updateCombo();
        this.updateStageInfo();
        this.switchScreen('game-screen');
        this.initializeBoard();
        this.startTimer();
    }

    initializeBoard() {
        const $board = $('#game-board');
        $board.empty();

        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const $block = $('<div>')
                    .addClass('block')
                    .attr('data-x', x)
                    .attr('data-y', y)
                    .html(this.getRandomBlock());
                $board.append($block);
            }
        }

        // 초기 매칭 검사 및 제거
        while (this.findMatches().length > 0) {
            this.removeMatches();
            this.dropBlocks();
            this.fillEmptyBlocks();
        }
    }    getRandomBlock() {
        const block = this.blockTypes[Math.floor(Math.random() * this.blockTypes.length)];
        // 동물별 클래스 지정
        const blockClass = {
            '🪣': 'dog-block',     // 강아지
            '📄': 'cat-block',     // 고양이
            '🍕': 'rabbit-block',  // 토끼
            '🧻': 'panda-block',   // 판다
            '🧢': 'fox-block',     // 여우
            '⚽': 'tiger-block'    // 호랑이
        }[block] || '';
        
        return `<span class="${blockClass}">${block}</span>`;
    }

    selectBlock($block) {
        if (!this.isPlaying) return;
        
        $('.block').removeClass('selected');
        $block.addClass('selected');
        this.selectedBlock = $block;
    }

    getSwipeDirection(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    trySwapBlocks($block, direction) {
        if (!this.isPlaying) return;

        const x = parseInt($block.attr('data-x'));
        const y = parseInt($block.attr('data-y'));
        let nextX = x, nextY = y;

        switch (direction) {
            case 'left': nextX = x - 1; break;
            case 'right': nextX = x + 1; break;
            case 'up': nextY = y - 1; break;
            case 'down': nextY = y + 1; break;
        }

        if (nextX >= 0 && nextX < this.boardSize && nextY >= 0 && nextY < this.boardSize) {
            const $nextBlock = $(`.block[data-x="${nextX}"][data-y="${nextY}"]`);
            this.swapBlocks($block, $nextBlock);
        }
    }

    async swapBlocks($block1, $block2) {
        const temp = $block1.html();
        $block1.html($block2.html());
        $block2.html(temp);

        const matches = this.findMatches();
        if (matches.length === 0) {
            // 매칭이 없으면 원상복구
            $block2.html($block1.html());
            $block1.html(temp);
            return;
        }

        this.removeMatches();
        await this.dropBlocks();
        await this.fillEmptyBlocks();
        
        // 연쇄 매칭 체크
        while (this.findMatches().length > 0) {
            this.combo++;
            this.updateCombo();
            this.removeMatches();
            await this.dropBlocks();
            await this.fillEmptyBlocks();
        }

        this.combo = 0;
        this.updateCombo();
    }

    findMatches() {
        const matches = new Set();

        // 가로 매칭 검사
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize - 2; x++) {
                const block1 = $(`.block[data-x="${x}"][data-y="${y}"]`);
                const block2 = $(`.block[data-x="${x+1}"][data-y="${y}"]`);
                const block3 = $(`.block[data-x="${x+2}"][data-y="${y}"]`);

                if (block1.html() === block2.html() && block2.html() === block3.html()) {
                    matches.add(block1[0]);
                    matches.add(block2[0]);
                    matches.add(block3[0]);
                }
            }
        }

        // 세로 매칭 검사
        for (let x = 0; x < this.boardSize; x++) {
            for (let y = 0; y < this.boardSize - 2; y++) {
                const block1 = $(`.block[data-x="${x}"][data-y="${y}"]`);
                const block2 = $(`.block[data-x="${x}"][data-y="${y+1}"]`);
                const block3 = $(`.block[data-x="${x}"][data-y="${y+2}"]`);

                if (block1.html() === block2.html() && block2.html() === block3.html()) {
                    matches.add(block1[0]);
                    matches.add(block2[0]);
                    matches.add(block3[0]);
                }
            }
        }

        return Array.from(matches);
    }    removeMatches() {
        const matches = this.findMatches();
        if (matches.length === 0) return;

        matches.forEach(block => {
            $(block).empty();
        });

        // 점수 계산 (콤보 보너스 포함)
        const comboMultiplier = 1 + (this.combo * 0.5);
        this.score += Math.floor(matches.length * 100 * comboMultiplier);
        
        // 매칭 성공 횟수 증가
        this.matchCount++;
        this.updateScore();
        this.updateStageInfo();
        
        // 스테이지 목표 달성 확인
        const currentStageInfo = this.stages[this.currentStage - 1];
        if (this.matchCount >= currentStageInfo.target) {
            setTimeout(() => this.nextStage(), 500);
            return;
        }

        // 매치된 블록이 있으면 새로운 블록으로 채우기
        this.fillEmptyBlocks();
    }

    async dropBlocks() {
        let dropped = false;

        for (let x = 0; x < this.boardSize; x++) {
            for (let y = this.boardSize - 1; y > 0; y--) {
                const $current = $(`.block[data-x="${x}"][data-y="${y}"]`);
                if ($current.html() === '') {
                    for (let above = y - 1; above >= 0; above--) {
                        const $above = $(`.block[data-x="${x}"][data-y="${above}"]`);
                        if ($above.html() !== '') {
                            $current.html($above.html());
                            $above.html('');
                            dropped = true;
                            break;
                        }
                    }
                }
            }
        }

        if (dropped) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    async fillEmptyBlocks() {
        let filled = false;

        $('.block').each((_, block) => {
            const $block = $(block);
            if ($block.html() === '') {
                $block.html(this.getRandomBlock());
                filled = true;
            }
        });

        if (filled) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }    startTimer() {
        const currentStageInfo = this.stages[this.currentStage - 1];
        let timeLeft = currentStageInfo.time;
        $('#timer').text(timeLeft);

        if (this.currentTimer) {
            clearInterval(this.currentTimer);
        }

        this.currentTimer = setInterval(() => {
            timeLeft--;
            $('#timer').text(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(this.currentTimer);
                this.endGame();
            }
        }, 1000);
    }    updateStageInfo() {
        const currentStageInfo = this.stages[this.currentStage - 1];
        $('#stage').text(`Stage ${this.currentStage}`);
        $('#target').text(`매칭 횟수: ${this.matchCount}/${currentStageInfo.target}`);
    }    nextStage() {
        if (this.currentStage < this.stages.length) {
            // Create stage transition element
            const $transition = $('<div>')
                .addClass('stage-transition')
                .text(`Stage ${this.currentStage + 1}`)
                .appendTo('body');

            // Move to next stage
            this.currentStage++;
            this.matchCount = 0;
            // 흔들기 횟수 리셋
            this.shuffleCount = 2;
            this.updateShuffleButton();
            $('#shuffle-button')
                .removeClass('shuffle-disabled')
                .addClass('shuffle-active');
            
            // Remove transition element after animation
            setTimeout(() => {
                $transition.remove();
                // Reset board and start new stage timer
                this.initializeBoard();
                this.startTimer();
            }, 2000);

            this.updateStageInfo();
        } else {
            // Game completed
            this.endGame(true);
        }
    }

    endGame(completed = false) {
        this.isPlaying = false;
        clearInterval(this.currentTimer);
        
        const finalMessage = completed ? 
            '축하합니다! 모든 스테이지를 클리어하셨습니다!' : 
            '게임 종료!';
        
        $('#result-screen h2').text(finalMessage);
        $('#final-score').text(this.score);
        
        const bestScore = localStorage.getItem('bestScore') || 0;
        if (this.score > bestScore) {
            localStorage.setItem('bestScore', this.score);
        }
        $('#best-score').text(Math.max(this.score, bestScore));
        
        this.switchScreen('result-screen');
    }

    pauseGame() {
        // 일시정지 기능 구현
        this.isPlaying = !this.isPlaying;
    }

    updateScore() {
        $('#score').text(this.score);
    }

    updateCombo() {
        $('#combo').text(`Combo: ${this.combo}`);
    }

    shuffleBoard() {
        if (this.shuffleCount <= 0 || !this.isPlaying) return;

        // 보드의 모든 블록을 새로 섞기
        $('.block').each((_, block) => {
            $(block).empty().append(this.getRandomBlock());
        });

        // 매치되는 블록이 있으면 다시 섞기
        while (this.findMatches().length > 0) {
            $('.block').each((_, block) => {
                $(block).empty().append(this.getRandomBlock());
            });
        }

        // 흔들기 횟수 감소
        this.shuffleCount--;
        this.updateShuffleButton();
    }

    updateShuffleButton() {
        const $button = $('#shuffle-button');
        $button.text(`흔들기 ${this.shuffleCount}번`);
        
        if (this.shuffleCount <= 0) {
            $button.removeClass('shuffle-active').addClass('shuffle-disabled');
        }
    }

    switchScreen(screenId) {
        $('.screen').addClass('hidden');
        $(`#${screenId}`).removeClass('hidden');
    }
}

// 게임 인스턴스 생성
$(document).ready(() => {
    new AnipangGame();
});
