# MY PROJECT
This is my first docker project that is stable and works fine, enjoy :)


It works in website that have admin (more functions) and the 'balconista' that is simple and focus to create schedules, futhermore a 'cidadão' that can create an account and schedule in your home, you can just not use this function if you want.

## REQUIREMENTS
>WSL 2
Docker Desktop
>And the project

## Step by Step

Use the v4 folder, v4_ use other way.

1. Download the zip or do it with git push in your terminal
2. Rename .env.example to just .env
3. Configure the .env.example to you context. Change the (DbName) and (DbPassword) in both DATABASE_URL acording to what you put in.
4. Be sure that you are inside of project folder, then run:
5. > docker compose up --build

To acess it go to your favorite browser and put localhost:3000
Start Schedule :)




## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
