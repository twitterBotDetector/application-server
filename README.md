# TweeBotD (Application Server)

(**Note:** This repo contains the application code for the Node.js server for the [TweeBotD](https://tweebotd.herokuapp.com) website. Check this [repository](https://github.com/twitterBotDetector/ML-classification-server) for the machine learning classification server)

This project's aim is to use machine learning to identify twitter bots. It  allows users to sign in using their Twitter account and browse their Twitter timeline; showing alerts for tweets made by 'detected' bot accounts.

## Installation

We recommend using docker to run the TweeBotD app.
Steps to run the project:
1. Install [Docker](https://docs.docker.com/install/)
2. Install docker-compose:
   `pip install docker-compose`
2. Clone the project from the github repository:
   `git clone https://github.com/twitterBotDetector/application-server`
3. Store the environment variables needed to run the project in a .env file in the cloned `application-server` folder. Check the [docker-compose.yml](https://github.com/twitterBotDetector/application-server/blob/master/docker-compose.yml) to know what variables are required. 

    (***Note**: Make sure you have a Twitter app for the consumer and access tokens. The first 4 secrets need the app's Twitter OAuth tokens. Click [here](https://apps.twitter.com/) to create a Twitter app, if you don't have one*)
 
4. Change directory to `application-server` and run the app:
   `docker-compose up`
5. Open up a browser and go to   http://127.0.0.1:8085

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/twitterBotDetector/UI/blob/master/LICENSE) file for details