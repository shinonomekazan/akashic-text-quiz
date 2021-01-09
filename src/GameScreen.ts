import { Label } from "@akashic-extension/akashic-label";
import BottomPopup = require("./BottomPopup");
import Button = require("./button/Button");
import ImageTextButton = require("./button/ImageTextButton");
import TextButton = require("./button/TextButton");
import turn = require("./enum/Turn");
import GameCore = require("./GameCore");
import Player = require("./Player");
import * as events from "./common/events";

class GameScreen extends g.E {

	gameCore: GameCore;

	statusTextLayout: g.E;
	phaseTextLayout: g.E;
	phaseQuestionLayout: g.E;
	phaseScreenLayout: g.E;

	gameStatusLabel: Label;
	userStatusLabel: Label;
	questionLabel: Label;
	myAnswerLabel: Label;

	resetButton: Button;
	questionButton: Button;
	stopButton: Button;
	nextButton: Button;
	finishButton: Button;

	answerButtons: TextButton[];

	popup: BottomPopup;

	currentTurn: turn;

	question: string;
	myAnswer: string;

	answer: number;
	answerMin: number;
	answerMax: number;

	quizNum: number;

	constructor(params: g.EParameterObject, gameCore: GameCore) {
		super(params);

		this.gameCore = gameCore;

		this.quizNum = 0;

		// background
		new g.FilledRect({
			scene: this.scene,
			cssColor: "Indigo",
			width: this.width,
			height: this.height,
			local: true,
			parent: this
		});

		this.scene.message.add(ev => {
			if (!ev.data) return;

			if (ev.data.message === "Answer") {
				this.onReceiveAnswer(ev);
			}

			if (ev.data.message === "Failed") {
				if (ev.player.id !== g.game.selfId && g.game.age - ev.data.age < g.game.fps * 3)
				    this.showPopup((ev.player.name != null ? ev.player.name : "Player " + ev.player.id) + " Failed !");
			}

			if (ev.data.message === "Clear") {
				if (ev.player.id !== g.game.selfId && g.game.age - ev.data.age < g.game.fps * 3)
				    this.showPopup((ev.player.name != null ? ev.player.name : "Player " + ev.player.id) + " Clear !");
			}

			if (ev.data.message === "ClosePopup") {
				if (ev.player.id === g.game.selfId)
					this.closePopup();
			}

			if (ev.data.type === "text") {
				const inputTextEvent = ev as events.InputTextEvent;
				if (inputTextEvent.player.id === g.game.selfId) {
					if (inputTextEvent.player.id === g.game.selfId && this.currentTurn === turn.answer && this.myAnswer === "") {
						g.game.raiseEvent(new g.MessageEvent({
							message: "Answer",
							text: inputTextEvent.data.text
						}));
					}
				}
			}
		});

		this.createLayout();
		this.createTop();
		this.createAnswerButtons();
		this.createMasterButtons();

		this.onQuestionTurn();
	}

	createLayout(): void {
		this.statusTextLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: Math.round((this.width - 16) / 2),
			height: 100,
			x: 0,
			y: 0,
			local: true,
			parent: this
		});

		this.phaseTextLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: Math.round((this.width - 16) / 2),
			height: 100,
			x: Math.round((this.width - 16) / 2) + 16,
			y: 0,
			local: true,
			parent: this
		});

		this.phaseQuestionLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: this.width,
			height: 160,
			x: 0,
			y: this.phaseTextLayout.height + 16,
			local: true,
			parent: this
		});

		this.phaseScreenLayout = new g.E({
			scene: this.scene,
			// cssColor: "black",
			width: this.width,
			height: Math.round(this.width * .5),
			anchorX: .5,
			anchorY: 0,
			x: this.width / 2,
			y: this.phaseQuestionLayout.y + this.phaseQuestionLayout.height + 16,
			local: true,
			parent: this
		});
	}

	createTop(): void {
		this.gameStatusLabel = new Label({
			scene: this.scene,
			width: this.statusTextLayout.width - 24,
			font: this.gameCore.font,
			fontSize: 18,
			text: "gameStatusLabel",
			textColor: "white",
			x: 12,
			y: 8,
			local: true,
			parent: this.statusTextLayout
		});

		if (!this.gameCore.myPlayer.isMaster()) {
			this.userStatusLabel = new Label({
				scene: this.scene,
				width: this.statusTextLayout.width - 24,
				font: this.gameCore.font,
				fontSize: 18,
				text: "userStatusLabel",
				textColor: "white",
				x: 12,
				y: 40,
				local: true,
				parent: this.statusTextLayout
			});

			this.myAnswerLabel = new Label({
				scene: this.scene,
				width: this.phaseTextLayout.width - 24,
				font: this.gameCore.font,
				fontSize: 18,
				text: "answerLabel",
				textColor: "white",
				x: 12,
				y: 8,
				local: true,
				parent: this.phaseTextLayout
			});
		}

		this.questionLabel = new Label({
			scene: this.scene,
			width: this.phaseQuestionLayout.width,
			font: this.gameCore.font,
			fontSize: 32,
			text: "questionLabel",
			textColor: "white",
			textAlign: g.TextAlign.Center,
			x: 0,
			y: 16,
			local: true,
			parent: this.phaseQuestionLayout
		});

	}

	createAnswerButtons(): void {
		if (this.gameCore.myPlayer.isMaster()) return;

		this.answerButtons = [];

		let buttons = ["A", "B", "C", "D"];

		let parent = this.phaseScreenLayout;
		let width = Math.round(parent.width / 6);
		let height = width;
		let spaceX = (parent.width - width * 4) / 5;
		let spaceY = spaceX;
		let startX = spaceX + (width / 2);
		let stratY = parent.height / 2;

		let image = parent.scene.assets.button_answer as g.ImageAsset;

		for (let i = 0; i < buttons.length; i++) {
			let button = new ImageTextButton({
				scene: parent.scene,
				src: image,
				srcWidth: image.width,
				srcHeight: image.height,
				text: buttons[i],
				fontSize: Math.round(width / 2.5),
				width: width,
				height: height,
				x: startX + (i % 4) * (width + spaceX),
				y: stratY + Math.floor(i / 4) * (height + spaceY),
				isCercle: true,
				local: true,
				parent: parent
			});
			button.onClick.add(this.onAnswer, this);
			this.answerButtons.push(button);
		}
	}

	createMasterButtons(): void {
		let parent = this.phaseScreenLayout;

		let width = Math.round((parent.width - 40) / 2);
		let height = Math.round(width / 3);

		this.resetButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Change",
			fontSize: Math.round(height / 2),
			x: width / 2 + 16,
			y: parent.height / 2
		});

		this.questionButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Question!",
			fontSize: Math.round(height / 2),
			x: width * 3 / 2 + 24,
			y: parent.height / 2
		});

		this.stopButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Stop",
			fontSize: Math.round(height / 2),
			x: parent.width / 2,
			y: parent.height / 2
		});

		this.nextButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Next",
			fontSize: Math.round(height / 2),
			x: parent.width / 2,
			y: parent.height / 2
		});

		this.finishButton = new TextButton({
			scene: parent.scene,
			width: width,
			height: height,
			text: "Finish",
			fontSize: Math.round(height / 2),
			x: parent.width / 2,
			y: parent.height / 2 + height + 16
		});

		this.resetButton.onClick.add(this.onReset, this);
		this.questionButton.onClick.add(this.onQuestion, this);
		this.stopButton.onClick.add(this.onStop, this);
		this.nextButton.onClick.add(this.onNext, this);
		this.finishButton.onClick.add(this.onFinish, this);

		if (this.gameCore.myPlayer.isMaster()) {
			parent.append(this.resetButton);
			parent.append(this.questionButton);
			parent.append(this.stopButton);
			parent.append(this.nextButton);
			parent.append(this.finishButton);
		}
	}

	showPopup(text: string): void {
		if (this.popup && !this.popup.destroyed()) {
			this.popup.label.text = text;
			this.popup.label.invalidate();
			return;
		}

		// this.popup = new Popup({
		//     scene: this.scene,
		//     text: text,
		//     font: this.gameCore.font,
		//     width: this.width * .8,
		//     x: g.game.width / 2,
		//     y: g.game.height / 2,
		//     anchorX: .5,
		//     anchorY: .5,
		//     local: true,
		//     parent: this.scene
		// });

		this.popup = new BottomPopup({
			scene: this.scene,
			text: text,
			font: this.gameCore.font,
			width: this.width,
			x: g.game.width / 2,
			y: g.game.height,
			anchorX: .5,
			anchorY: 1,
			local: true,
			parent: this.scene
		});

		this.popup.closeButton.onClick.add(() => {
			g.game.raiseEvent(new g.MessageEvent({ message: "ClosePopup" }));
		});
	}

	closePopup(): void {
		if (this.popup && !this.popup.destroyed()) {
			this.popup.destroy();
		}
	}

	onQuestionTurn(): void {
		console.log("onQuestionTurn");
		this.currentTurn = turn.question;

		this.quizNum++;

		this.gameStatusLabel.text = "Quiz: " + this.quizNum;
		this.gameStatusLabel.invalidate();

		this.updateQuestion();

		if (this.gameCore.myPlayer.isMaster()) {
			this.resetButton.show();
			this.questionButton.show();
			this.stopButton.hide();
			this.nextButton.hide();
			this.finishButton.hide();
		} else {
			this.userStatusLabel.text = "";
			this.userStatusLabel.invalidate();

			this.myAnswerLabel.text = "";
			this.myAnswerLabel.invalidate();

			this.questionLabel.hide();

			this.answerButtons.forEach((button) => {
				button.hide();
			});
		}
	}

	onAnswerTurn(): void {
		console.log("onAnswerTurn");
		this.currentTurn = turn.answer;

		this.updateAnswers();

		if (this.gameCore.myPlayer.isMaster()) {
			this.resetButton.hide();
			this.questionButton.hide();
			this.stopButton.show();
			this.nextButton.hide();
			this.finishButton.hide();
		} else {
			this.myAnswerLabel.text = "Your Answer: ";
			this.myAnswerLabel.invalidate();
			this.questionLabel.show();
			this.myAnswer = "";
			this.answerButtons.forEach((button) => {
				button.show();
			});
		}
	}

	onResult(): void {
		console.log("onResult");
		this.currentTurn = -1;

		this.closePopup();

		if (this.gameCore.myPlayer.isMaster()) {
			this.resetButton.hide();
			this.questionButton.hide();
			this.stopButton.hide();
			this.nextButton.show();
			this.finishButton.show();
		} else {
			if (this.checkWin()) this.onWin();
			else this.onLose();
		}
	}

	onLose(): void {
		console.log("onLose");
		this.currentTurn = -1;

		this.userStatusLabel.text = "You Lose";
		this.userStatusLabel.invalidate();
	}

	onWin(): void {
		console.log("onWin");
		this.currentTurn = -1;

		this.userStatusLabel.text = "You Win";
		this.userStatusLabel.invalidate();
	}

	checkWin(): boolean {
		return this.answer.toString() === this.myAnswer;
	}

	updateQuestion(): void {
		let questionAndAnswer = this.getQuestionAndAnswer();
		this.question = questionAndAnswer.question;
		this.answer = questionAndAnswer.answer;
		this.answerMax = questionAndAnswer.answerMax;
		this.answerMin = questionAndAnswer.answerMin;
		// console.log(this.question);

		this.questionLabel.text = "Question:\n" + this.question;
		this.questionLabel.invalidate();
	}

	updateAnswers(): void {
		let min = Math.max(Math.floor(this.answer / 10), this.answer - 1000, this.answerMin);
		let max = Math.min(this.answer * 10, this.answer + 1000, this.answerMax);
		if (max - min < 4) max = min + 4;

		let answers: number[] = [];
		let num: number;
		let i = 0;
		do {
			num = g.game.random.get(min, max);
			if ((num !== this.answer && answers.indexOf(num) < 0) || i > 1000) answers.push(num);
			i++;
		}
		while (answers.length < 4);

		answers[g.game.random.get(0, answers.length - 1)] = this.answer;

		if (!this.gameCore.myPlayer.isMaster()) {
			for (let i = 0; i < answers.length; i++) {
				this.answerButtons[i].setText(answers[i].toString());
			}
		}
	}

	getQuestionAndAnswer(): {question: string; answer: number; answerMax: number; answerMin: number} {
		let rand = g.game.random.get(0, 11);
		let numbers = rand < 6 ? this.getSummation() : this.getMultiplication();
		let question = "";
		let answer = -1;
		let answerMax = -1;
		let answerMin = -1;

		switch (rand) {
			case 0:
				question = numbers[0].toString() + " + " + numbers[1].toString() + " = ?";
				answer = numbers[2];
				answerMax = 10000;
				answerMin = Math.max(numbers[0], numbers[1]);
				break;
			case 1:
				question = numbers[0].toString() + " + ? = " + numbers[2].toString();
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 0;
				break;
			case 2:
				question = "? + " + numbers[0].toString() + " = " + numbers[2].toString();
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 0;
				break;

			case 3:
				question = "? - " + numbers[0].toString() + " = " + numbers[1].toString();
				answer = numbers[2];
				answerMax = 10000;
				answerMin = Math.max(numbers[0], numbers[1]);
				break;
			case 4:
				question = numbers[2].toString() + " - " + numbers[0].toString() + " = ?";
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 0;
				break;
			case 5:
				question = numbers[2].toString() + " - ? = " + numbers[0].toString();
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 0;
				break;

			case 6:
				question = numbers[0].toString() + " x " + numbers[1].toString() + " = ?";
				answer = numbers[2];
				answerMax = 100;
				answerMin = Math.max(numbers[0], numbers[1]);
				break;
			case 7:
				question = numbers[0].toString() + " x ? = " + numbers[2].toString();
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 1;
				break;
			case 8:
				question = "? x " + numbers[0].toString() + " = " + numbers[2].toString();
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 1;
				break;

			case 9:
				question = "? / " + numbers[0].toString() + " = " + numbers[1].toString();
				answer = numbers[2];
				answerMax = 100;
				answerMin = Math.max(numbers[0], numbers[1]);
				break;
			case 10:
				question = numbers[2].toString() + " / " + numbers[0].toString() + " = ?";
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 1;
				break;
			case 11:
				question = numbers[2].toString() + " / ? = " + numbers[0].toString();
				answer = numbers[1];
				answerMax = numbers[2];
				answerMin = 0;
				break;
		}

		return {question, answer, answerMax, answerMin};
	}

	getSummation(): number[] {
		let c = g.game.random.get(0, 10000);
		let a = g.game.random.get(0, c);
		let b = c - a;
		return [a, b, c];
	}

	getMultiplication(): number[] {
		let c = g.game.random.get(4, 100);
		let num = [];
		for (let i = Math.floor(Math.sqrt(c)); i >= 2; i--) {
			if (c % i === 0) num.push(i);
		}
		if (num.length === 0) return this.getMultiplication();
		let a = num[g.game.random.get(0, num.length - 1)];
		let b = a;
		if (g.game.random.generate() > .5) a = c / b;
		else b = c / a;
		return [a, b, c];
	}

	onReceiveAnswer(ev: g.MessageEvent): void {
		let text = ev.data.text;

		if (ev.player.id === g.game.selfId && this.currentTurn === turn.answer && this.myAnswer === "") {
			this.myAnswer += text;
			this.myAnswerLabel.text += text;
			this.myAnswerLabel.invalidate();

			(this.scene.assets.se as g.AudioAsset).play();

			if (this.checkWin()) {
				this.onWin();
				g.game.raiseEvent(new g.MessageEvent({ message: "Clear", age: g.game.age }));
			} else {
				this.onLose();
				g.game.raiseEvent(new g.MessageEvent({ message: "Failed", age: g.game.age }));
			}
		}
	}

	onAnswer(ev: g.PointEvent): void {
		let text = (ev.target.parent as TextButton).text.text;

		if (ev.player.id === g.game.selfId && this.currentTurn === turn.answer && this.myAnswer === "") {
			g.game.raiseEvent(new g.MessageEvent({ message: "Answer", text: text }));
		}
	}

	onReset(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		// console.log("onReset");
		this.updateQuestion();
	}

	onQuestion(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		if (this.question.length === 0) {
			console.log("Question is empty !");
			return;
		}
		this.onAnswerTurn();
	}

	onStop(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		this.onResult();
	}

	onNext(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		this.onQuestionTurn();
	}

	onFinish(ev: g.PointEvent): void {
		if (ev.player.id !== Player.masterId) return;
		console.log("onFinish");
	}

}

export = GameScreen;
