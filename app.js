phina.globalize();

// 定数

// 色
const PLAYER_COLOR = "#e55039";
const ENEMY_COLOR = "#0c2461";

// ユニット数
const PLAYER_NUM = 4;
const ENEMY_NUM = 6;

phina.define('GameScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        this.backgroundColor = "#f8c291";

        const self = this;

        const BOX_COLOR = "#f7f1e3";

        this.counter = 0;
        this.status = "none";

        const boxes = [];
        const circles = [];
        const boxeSize = 40;
        const areaSize = 600;

        let playerCnt = 0;

        // メッセージ領域
        this.message = Label({
            text: PLAYER_NUM,
            fill: "#000000",
            fontSize: 80,
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(4));

        // 箱を敷き詰める領域
        const area = RectangleShape({
            width: areaSize,
            height: areaSize,
            fill: BOX_COLOR,
            padding: 0,
        }).addChildTo(this).setPosition(20, 20);
        area.setOrigin(0, 0);

        // 箱を敷き詰める
        for (let x = boxeSize; x <= area.width; x += boxeSize) {
            for (let y = boxeSize; y <= area.height; y += boxeSize) {
                const box = RectangleShape({
                    width: boxeSize,
                    height: boxeSize,
                    fill: BOX_COLOR,
                    strokeWidth: 0,
                });
                box.addChildTo(area).setPosition(x - boxeSize / 2, y - boxeSize / 2);
                box.__color = null;
                boxes.push(box);

                box.setInteractive(true);
                box.on("pointstart", function() {
                    if (self.status !== "playerTurn") {
                        return;
                    }
                    if (playerCnt < PLAYER_NUM) {
                        createPlayer(box);
                        playerCnt++;
                        self.message.text = PLAYER_NUM - playerCnt;
                    }

                    if (playerCnt === PLAYER_NUM) {
                        self.status = "ready";
                        self.message.hide();
                        startButton.show();
                    }
                });
            }
        }


        function createCircle(color, x, y) {
            // 円を描く
            const circle = CircleShape({
                radius: 1,
                fill: color,
                stroke: 0,
                fill: "transparent",
            });
            circle.addChildTo(area).setPosition(x, y);
            circle.__color = color;
            circles.push(circle);
        }

        // 指定した数の敵をランダムな位置に配置する
        function createEnemies(count) {
            for (let i = 0; i < count; i++) {
                // ランダムのboxの中心座標を得る
                const box = boxes[Math.floor(Math.random() * boxes.length)];
                const x = box.x;
                const y = box.y;
                createCircle(ENEMY_COLOR, x, y);
            }
        }

        // 指定したboxの中心にプレイヤーの円を配置する
        function createPlayer(box) {
            const x = box.x;
            const y = box.y;
            createCircle(PLAYER_COLOR, x, y);
            update();
        }

        // 領域を最新化する
        function update() {
            for (let i = 0; i < circles.length; i++) {
                const circle = circles[i];
                // 円と重なっている箱を黒く塗る
                for (let n = 0; n < boxes.length; n++) {
                    const box = boxes[n];
                    if (box.__color === null && Collision.testCircleRect(circle, box)) {
                        box.alpha = 0;
                        box.fill = circle.__color;
                        box.__color = circle.__color;
                        box.tweener.to({alpha: 1}, 200).play();
                    }
                }
            }
        }

        // 色ごとのboxの数を{色: 数}のオブジェクトで返す
        this.getColorCount = function() {
            const result = {
                "player": 0,
                "emeny": 0,
                "empty": 0,
            };
            for (let i = 0; i < boxes.length; i++) {
                const box = boxes[i];
                if (box.__color === PLAYER_COLOR) {
                    result.player += 1;
                } else if (box.__color === ENEMY_COLOR) {
                    result.emeny += 1;
                } else {
                    result.empty += 1;
                }
            }
            return result;
        }

        // 円を大きくする
        this.grawCircle = function() {
            for (let i = 0; i < circles.length; i++) {
                const circle = circles[i];
                circle.radius = (circle.radius + 15);
            }
            update();
        };

        function startGame() {
            // 初期化
            this.status = "none";
            circles.length = 0;
            playerCnt = 0;
            self.message.text = PLAYER_NUM;
            boxes.forEach(function(box) {
                box.fill = BOX_COLOR;
                box.__color = null;
            });
            setTimeout(function() {
                createEnemies(ENEMY_NUM);
                update();
                self.status = "playerTurn";
            }, 1);
        }

        startGame();

        // プレイヤーの操作期間
        function playerTurn() {

            let cnt = PLAYER_NUM;
            while (cnt > 0) {
                createPlayer(boxes[Math.floor(Math.random() * boxes.length)]);
                cnt--;
            }

        }

        // 開始ボタン
        const startButton = MyButton({
            text: "START",
            x: 100,
            y: 100,
            width: 300,
            height: 100,
            fill: "#60a3bc",
            fontSize: 50,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(5)).hide();
        startButton.selected = () => {
            if (self.status === "ready") {
                self.status = "playing";
                startButton.hide();
            }
        };
    
        // リトライボタン
        this.retryButton = MyButton({
            text: "NEW GAME",
            x: 100,
            y: 100,
            width: 350,
            height: 100,
            fill: "#60a3bc",
            fontSize: 50,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(6)).hide();
        this.retryButton.selected = () => {
            self.retryButton.hide();
            startGame();
        };

    },
    update: function() {
        this.counter++;
        if (this.counter < 3) {
            return;
        }
        this.counter = 0;

        if (this.status === "playing") {
            this.grawCircle();

            const count = this.getColorCount();

            if (count["empty"] === 0) {
                this.status = "end";
                console.log(count);
                const percent = Math.ceil(count.player / (count.player + count.emeny) * 100);
                this.message.text = percent + "% ";
                if (percent > 50) {
                    this.message.text += "WIN!";
                } else if (percent < 50) {
                    this.message.text += "LOOSE";
                } else {
                    this.message.text += "DRAW";
                }
                this.message.show();
                this.retryButton.show();
            }
        }
    }
});

phina.define('MyButton', {
    superClass: 'Button',
    init: function(param) {
        this.superInit(param);

        const self = this;

        self.pointOn = false;

        const a = PathShape({
            paths:[Vector2(-1 * this.width/2 + 4, this.height/2 - 2), Vector2(this.width/2 - 4, this.height/2 - 2)],
            stroke: "black",
        })
        .addChildTo(this).setPosition(0, 0);
        a.alpha = 0.2;

        const b = PathShape({
            paths:[Vector2(-1 * this.width/2 + 4, - 1 * this.height/2 + 2), Vector2(this.width/2 - 4, -1 * this.height/2 + 2)],
            stroke: "white",
        })
        .addChildTo(this).setPosition(0, 0);
        b.alpha = 0.2;

        this.selected = null;

        this.on("pointstart", () => {
            self.pointOn = true;
            self.tweener.to({scaleX: 0.95, scaleY: 0.95}, 10).play();
        });
        this.on("pointend", () => {
            if (!self.pointOn) return;
            if (!self.visible) return;
            self.tweener.to({scaleX: 1, scaleY: 1}, 10)
            .call(() => {
                if (self.selected) {
                    self.selected();
                }
            })
            .play();
        });
        this.on("pointout", () => {
            self.pointOn = false;
            self.tweener.to({scaleX: 1, scaleY: 1}, 10).play();
        });

    },
});


// ASSETS = {
//     image: {
//         "arrow": "img/arrow.png",
//         "mouse": "img/mouse.png",
//         "mouse2": "img/mouse2.png",
//         "frog": "img/frog.png",
//     }
// };

phina.main(function() {
    App = GameApp({
        // assets: ASSETS,
        startLabel: 'GameScene',
        scenes: [
            // {
            //     label: 'TitleScene',
            //     className: 'TitleScene',
            // },
            {
                label: 'GameScene',
                className: 'GameScene',
            },
        ],
    });

    App.fps = 15;

    App.run();

});
