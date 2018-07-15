# DisTime


The aim of this project is to feed a database storing distance and travel time (car and public transport) between all communes for the region Ile de France

Project build with NodeJs and mongoDB.

To launch project:
- clone the project
- using the commands lines when you are in project directory:
    * launch 'npm install' to grab the dependencies
<<<<<<< HEAD
    * rename .env.default to .env and set the env variables: you will need to request some keys to the below API
		* to start:  node index.babel.js


This project is using various API/ source information : 

* https://api.gouv.fr/api/api-geo.html
to get back the list of communes in Ile de France

* https://www.data.gouv.fr/fr/datasets/arrondissements-1/
to get back Paris arrondissement details

* https://www.navitia.io
to get the travel time in transport

* https://api.mapbox.com/directions/v5/mapbox/driving
to get the distances and travel time by car
