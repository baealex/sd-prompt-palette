# Stable Diffusion Prompt Palette

![](https://github.com/baealex/sd-prompt-palette/assets/35596687/a8bbe847-fa05-4324-9f39-accbb9effa63)

![](https://github.com/baealex/sd-prompt-palette/assets/35596687/d4c2cb5f-f308-4101-9a13-d913a01d01b2)

영어가 아직 부족해서 이미지를 자연스럽게 표현하는데 어려움을 겪고 있어서 만들었습니다. 팔레트의 물감처럼 단어를 다룰 수 있게 하는 것이 목표입니다.

<br>

## Feature

- [x] 키워드 클릭시 키워드가 복사됩니다. (https나 localhost 에서만 동작합니다)
- [x] 키워드나 카테고리를 오른쪽 클릭할 경우 삭제 및 수정이 가능합니다.
- [x] 이미지의 프롬프트를 조회할 수 있습니다.
- [ ] 단어를 호버하면 단어에 대한 샘플 이미지가 표기됩니다.
- [ ] 카테고리의 키워드를 랜덤 조합하여 새로운 아이디어를 얻을 수 있습니다.
- [ ] 자주 사용하는 프롬프트의 조합을 보다 편리하게 관리할 수 있습니다.

<br>

## Demo site

[sd-prompt-palette.vvip.page](https://sd-prompt-palette.vvip.page/)

<br>

## Self-host

### use NodeJS

```
git clone https://github.com/baealex/sd-prompt-palette
cd server/src
npm i
npm run build:client
npm run start
```

`http://localhost:3332`로 접속할 수 있습니다.

### use Docker

```
git clone https://github.com/baealex/sd-prompt-palette
git pull && docker-compose pull && docker-compose up -d
```

`http://localhost:3000`로 접속할 수 있습니다.
