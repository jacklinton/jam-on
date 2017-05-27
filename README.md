# Jam*On

This repository is , for now, a framework of a music jukebox app written in React-Native using Expo. 

The purpose of this app is to create a single place where users can quickly and easily find and play the music they want to hear from the giant Archive.org eTree, Phish.In, and PanicStream live concert recording hosts. It will allow logged in users to create their own jukebox style collections and playlists which they will be able to access from any device with web access simply by logging in. Eventually, features like sharing observable playlists and notifications when a users favorite artist has scheduled a show in close proximity to their location may be added.

### Major Todos
* Finish server seeding
* Connect app to server
* Break the app up into modules and refactor all code
* Get Apollo client or Relay Modern up and running
* Create module for collections
* Create module for playlists
  * Setup buffering/persistent caching of items in playlist (redux persists?)
  * Make app fully functional offline
* Eject from expo and use a more performant sound package for background streaming etc
* Deploy to appstore
