# Humanoid Server

This repository hosts backend code for the Humanoid VR teleoperation project. The server is responsible for handling the communication between the VR client and the robot. The app will receive messages from the VR client that encode the shape of your hand using float values, and then forward these messages to the robot. The robot will then use its control systems (built by WATonomous) to move its fingers to match the shape of your hand. In the future, this server must be capable of streaming even more data, such as head tracking information and video feeds, between the VR client and the robot.

- **Current Design**: Built using WebSockets and Node.js. Monolith. Goal is to scale using EC2 Auto-Scaling Groups and ALB.
- **Future Design**: Microservices architecture using Kubernetes, Docker, with consideration to switch to using Go/gRPC for better performance.
