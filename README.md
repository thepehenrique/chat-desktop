O Chat Desktop é uma aplicação de comunicação desenvolvida com Electron, TypeScript e Vite, voltada para troca de mensagens e comunicação em tempo real entre usuários. 
O sistema possui autenticação, cadastro e verificação de usuários, gerenciamento de usuários online/offline e conversas individuais. Além das mensagens de texto, 
o projeto conta com um sistema de chamadas de áudio utilizando WebRTC, com sinalização realizada através de WebSocket, permitindo iniciar, aceitar, recusar e encerrar chamadas entre usuários. 
Durante uma chamada, também é possível mutar e desmutar o microfone e controlar o volume do áudio recebido. A arquitetura separa as responsabilidades entre o processo principal do Electron, 
o preload, a interface do renderer e serviços específicos, como o WebRTCService, buscando manter o código organizado, tipado e preparado para futuras funcionalidades.
