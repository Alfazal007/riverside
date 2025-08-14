create table users (
	id serial primary key,
	email varchar(255) not null unique,
    username varchar(255) not null,
	password varchar(255) not null
);
