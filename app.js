phina.globalize();

// 定数

// 色
const PLAYER_COLOR = "#e55039";
const ENEMY_COLOR = "#2c3e50";

// ユニット数
const PLAYER_NUM = 4;
const ENEMY_NUM = 6;

phina.define('CheckScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        this.backgroundColor = "black";

        const self = this;

        const query = new URLSearchParams(window.location.search);

        if (query.has("data")) {

            const data = URLCompressor.expand(query.get("data"));

            setTimeout(function() {
                self.exit("GameScene", {data: data});
            }, 100);

            // クエリパラメータはもう不要
            const url = new URL(window.location.href);
            history.replaceState(null, '', url.pathname);

        } else {
            setTimeout(function() {
                self.exit("TitleScene");
            }, 100);
        }

    },
});

phina.define('TitleScene', {
    superClass: 'DisplayScene',
    init: function(param/*{}*/) {
        this.superInit(param);

        this.backgroundColor = PLAYER_COLOR;

        const self = this;

        Label({
            text: "INK",
            fontSize: 150,
            fontWeight: 800,
            fill: "white",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-2));

        Label({
            text: "TAP TO START",
            fontWeight: 800,
            fill: "white",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(5));

        this.on("pointstart", () => {
            self.exit("GameScene");
        });

    },
});

phina.define('ShareScene', {
    superClass: 'DisplayScene',
    init: function(param/*{text: String}*/) {
        this.superInit(param);

        this.backgroundColor = "rgba(0, 0, 0, 0.5)";

        RectangleShape({
            width: 600,
            height: 300,
            fill: "#ecf0f1",
            strokeWidth: 0,
            cornerRadius: 10,
            shadow: "black",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());

        Label({
            text: "この問題に再チャレンジできるURLを\nクリップボードにコピーしました。",
            fontSize: 30,
            fontWeight: 800,
            fill: "black",
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());

        this.on("pointstart", () => {
            this.exit();
        });
    },
});

phina.define('GameScene', {
    superClass: 'DisplayScene',
    init: function(param/*{data: enemyBoxes}*/) {
        this.superInit(param);

        this.backgroundColor = "#ecf0f1";

        const self = this;

        const BOX_COLOR = "#bdc3c7";

        this.counter = 0;
        this.status = "none";

        const boxes = [];
        const circles = [];
        const boxeSize = 40;
        const areaSize = 600;

        const enemyBoxes = [];
console.log(param);
        // 敵の初期配置データが存在するなら使う
        if (param.data) {
            const boxes = JSON.parse(param.data);
            boxes.forEach((boxID) => {
                enemyBoxes.push(boxID);
            });
        }
        console.log(param);

        let playerCnt = 0;

        // メッセージ領域
        this.message = Label({
            text: PLAYER_NUM,
            fill: PLAYER_COLOR,
            fontSize: 80,
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(3.5));

        // 箱を敷き詰める領域
        const area = RectangleShape({
            width: areaSize,
            height: areaSize,
            fill: BOX_COLOR,
            padding: 0,
        }).addChildTo(this).setPosition(20, 20);
        area.setOrigin(0, 0);

        area.setInteractive(true);
        area.on("pointstart", function(e) {
            if (self.status !== "playerTurn") {
                return;
            }
            if (playerCnt < PLAYER_NUM) {
                createPlayer(e.pointer.position.x - area.x, e.pointer.position.y - area.y);
                playerCnt++;
                self.message.text = PLAYER_NUM - playerCnt;
            }

            if (playerCnt === PLAYER_NUM) {
                self.status = "ready";
                self.message.hide();
                startButton.show();
            }
        });

        this.resultLabel = Label({
            text: "100%",
            fontSize: 280,
            fill: "white",
            fontFamily: "monospace",
            fontWeight: 800,
        }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-2.5)).hide();
        this.resultLabel.alpha = 0.8;


        // 箱を敷き詰める
        for (let x = boxeSize; x <= area.width; x += boxeSize) {
            for (let y = boxeSize; y <= area.height; y += boxeSize) {
                const box = {
                    top: y - boxeSize / 2,
                    left: x - boxeSize / 2,
                    width: boxeSize,
                    height: boxeSize,
                    __color: null,
                };
                boxes.push(box);
            }
        }


        function createCircle(color, x, y) {
            // 円を描く
            const circle = CircleShape({
                radius: 0.1,
                fill: color,
                strokeWidth: 0,
                fill: "transparent",
            });
            circle.addChildTo(area).setPosition(x, y);
            circle.__color = color;
            circles.push(circle);
            return circle;
        }

        // 指定した数の敵をランダムな位置に配置する
        function createEnemies(count) {
            if (count === 0) {
                for (let i = 0; i < enemyBoxes.length; i++) {
                    const box = boxes[enemyBoxes[i]];
                    const x = box.left;
                    const y = box.top;
                    createCircle(ENEMY_COLOR, x, y);
                }
            } else {
                enemyBoxes.length = 0;
                for (let i = 0; i < count; i++) {
                    // ランダムのboxの中心座標を得る
                    const index = Math.floor(Math.random() * boxes.length);
                    const box = boxes[index];
                    const x = box.left;
                    const y = box.top;
                    createCircle(ENEMY_COLOR, x, y);
                    enemyBoxes.push(index);
                }
            }
        }

        // 指定したboxの中心にプレイヤーの円を配置する
        function createPlayer(x, y) {
            createCircle(PLAYER_COLOR, x, y);
            update();
        }

        // 領域を最新化する
        function update() {
            for (let i = 0; i < circles.length; i++) {
                const circle = circles[i];
                // 円と重なっている箱を塗る
                for (let n = 0; n < boxes.length; n++) {
                    const box = boxes[n];
                    if (box.__color === null && Collision.testCircleRect(circle, phina.geom.Rect(box.left - box.width / 2, box.top - box.height / 2, box.width, box.height))) {
                        const ink = RectangleShape({
                            width: box.width,
                            height: box.height,
                            fill: circle.__color,
                            strokeWidth: 0,
                        }).addChildTo(area).setPosition(box.left, box.top);
                        ink.alpha = 0.5;
                        box.__color = circle.__color;
                        ink.tweener.to({alpha: 1}, 1000).play();
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
                circle.radius = (circle.radius + 10);
            }
            update();
        };

        function startGame(retry) {
            // 初期化
            this.status = "none";
            area.children.clear();
            circles.forEach(function(circle) {
                circle.remove();
            });
            circles.length = 0;
            playerCnt = 0;
            self.message.text = PLAYER_NUM;
            boxes.forEach(function(box) {
                box.__color = null;
            });
            setTimeout(function() {
                if (retry) {
                    createEnemies(0);
                } else {
                    createEnemies(ENEMY_NUM);
                }
                update();
                self.status = "playerTurn";
            }, 1);
        }

        startGame(enemyBoxes.length !== 0);

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
            fill: "#3498db",
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
            text: "RETRY",
            x: 100,
            y: 100,
            width: 250,
            height: 100,
            fill: "#00b894",
            fontSize: 50,
        }).addChildTo(this).setPosition(this.gridX.center(-4), this.gridY.center(5.5)).hide();
        this.retryButton.selected = () => {
            self.retryButton.hide();
            self.newButton.hide();
            this.resultLabel.hide();
            startGame(true);
        };

        // 新規ゲームボタン
        this.newButton = MyButton({
            text: "NEW",
            x: 100,
            y: 100,
            width: 250,
            height: 100,
            fill: "#3498db",
            fontSize: 50,
        }).addChildTo(this).setPosition(this.gridX.center(4), this.gridY.center(5.5)).hide();
        this.newButton.selected = () => {
            self.newButton.hide();
            self.retryButton.hide();
            this.resultLabel.hide();
            startGame(false);
        };

        // 共有ボタン
        this.shareButton = MyButton({
            text: "SHARE",
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            fill: "#95a5a6",
            fontSize: 30,
        }).addChildTo(this).setPosition(this.gridX.center(5.2), this.gridY.center(7.2));
        this.shareButton.selected = () => {
            console.log(enemyBoxes);
            const data = URLCompressor.compress(JSON.stringify(enemyBoxes));
            const url = location.protocol + "//" + location.host + location.pathname.replace("index.html", "index2.html") + "?data=" + data;
            navigator.clipboard.writeText(url);
            App.pushScene(ShareScene({text: "SHARE"}));
        };

    },
    update: function() {
        this.counter++;
        if (this.counter < 5) {
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
                this.resultLabel.text = " " + percent + "% ";
                if (percent > 50) {
                    this.message.text = "WIN!";
                } else if (percent < 50) {
                    this.message.text = "LOSE...";
                } else {
                    this.message.text = "DRAW";
                }
                this.message.show();
                this.resultLabel.show();
                this.retryButton.show();
                this.newButton.show();
                this.shareButton.show();
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
        startLabel: 'CheckScene',
        scenes: [
            {
                label: 'CheckScene',
                className: 'CheckScene',
            },
            {
                label: 'TitleScene',
                className: 'TitleScene',
            },
            {
                label: 'GameScene',
                className: 'GameScene',
            },
            {
                label: 'ShareScene',
                className: 'ShareScene',
            },
        ],
    });

    App.fps = 30;

    App.run();

});
