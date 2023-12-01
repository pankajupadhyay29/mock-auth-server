FROM node:16-buster AS build_image_rosterperform
COPY . .
RUN npm install -g mock-auth-server
EXPOSE 3000
CMD ["mock-auth-server"]