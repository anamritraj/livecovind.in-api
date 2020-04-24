# livecovind.in-api
API for the website hosted at https://livecovid.in

## Warning
I do not code like this in production, this is a side project and was hacked in less than 3-4 hours and after that I was too lazy to change it. :smile: If you want you can optimize it and I would be happy to approve the PR. 

And yes there is no database for now. We don't need it as of now, but we might need one soon, I am planning to get one this weekend. Suggestions are welcome.

## Contribute
- Clone this repo.
- Do `npm install`
- Run `node ./bin/www` in the cloned directory.
- The API will be running at http://localhost:3323
- If you want to override this port number, add a `.env` file at the root and add one line to that file
```
PORT=4444
```
- This will change the port number to 4444
- For best development experience, install nodemon
  - `npm i nodemon -g`
  - Then run, `nodemon ./bin/www`
  - This will reload the server everytime you make code changes. Sweet!
  
## Generate vapid keys
- You will also need to generate your own vapid keys to test notifications on your browser. 
- Use this tool to generate this key and replace it in `.env` file https://www.npmjs.com/package/web-push#command-line

## Setup a firebase account
- You need to have a firebase account and a project created in the firebase account to work on this repo.
- Head over to http://firebase.google.com/ to create a free account. Make sure to generate `firebase.json` file to give access to your firebase account from the nodejs application.
- Use this link to generate your json file and save it as `firebase.json` in root directory. https://firebase.google.com/docs/admin/setup#initialize-sdk

## Front-end application
The companion front-end application is in this repo, https://github.com/anamritraj/livecovid.in-webapp. Feel free to fork and contribute! 

## Disclaimer
This is not an official government project. This is not associated in any way with my employer. I am not getting paid to do this. Also, I have no intentions of making money from this. This is created to keep people informed about the current state of Covid-19 in the country. If you need help, please call the emergency numbers listed on the [website here](https://www.mohfw.gov.in/) or call 100.

If you feel any information is missing or there is any error, please feel free to create [an issue](https://github.com/anamritraj/livecovid.in-webapp/issues/new) or reach out to me directly on [Twitter](https://twitter.com/anamritraj) and I would be happy to assist.

## Credits

This would not have been possible without the awesome guys at https://github.com/covid19india. I was initially scraping the MoHFW website, but then I got to know about them and since then this project internally calls their API. They are doing really awesome work maintaining a crowdsorced data-base of patients and cases. Thanks to them for all the hard work!

## Licence 
MIT

More details to be updated.
