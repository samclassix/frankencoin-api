import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });

	const config = new DocumentBuilder()
		.setTitle(process.env.npm_package_name)
		.setDescription('The API description')
		.setVersion(process.env.npm_package_version)
		// .addBearerAuth({
		// 	type: 'apiKey',
		// 	description: 'JWT Authorization via API',
		// 	name: 'Authorization',
		// 	in: 'header',
		// 	scheme: 'bearer',
		// })
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('swagger', app, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	await app.listen(process.env.PORT || 3000);
}
bootstrap();
