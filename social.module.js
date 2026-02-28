"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialModule = void 0;

const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const social_controller_1 = require("./social.controller");
const social_facebook_service_1 = require("./social-facebook.service");
const social_youtube_service_1 = require("./social-youtube.service");
const social_tiktok_service_1 = require("./social-tiktok.service");
const social_twitter_service_1 = require("./social-twitter.service");

let SocialModule = class SocialModule {
};
exports.SocialModule = SocialModule;
exports.SocialModule = SocialModule = __decorate([
    (0, common_1.Module)({
        controllers: [social_controller_1.SocialController],
        providers: [
            prisma_service_1.PrismaService,
            social_facebook_service_1.SocialFacebookService,
            social_youtube_service_1.SocialYoutubeService,
            social_tiktok_service_1.SocialTiktokService,
            social_twitter_service_1.SocialTwitterService,
        ],
        exports: [
            social_facebook_service_1.SocialFacebookService,
            social_youtube_service_1.SocialYoutubeService,
            social_tiktok_service_1.SocialTiktokService,
            social_twitter_service_1.SocialTwitterService,
        ],
    })
], SocialModule);
//# sourceMappingURL=social.module.js.map
