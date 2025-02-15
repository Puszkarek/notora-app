#!/bin/bash

docker run --name restaurantDB -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql