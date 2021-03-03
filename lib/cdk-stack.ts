import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as lambda from "@aws-cdk/aws-lambda";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as rds from "@aws-cdk/aws-rds";

export class CdkStack extends cdk.Stack {
	constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const api = new appsync.GraphqlApi(this, "SlsAppApi", {
			name: "sls-cdk-appsync-backend",
			schema: appsync.Schema.fromAsset("graphql/schema.graphql"),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: appsync.AuthorizationType.API_KEY,
					apiKeyConfig: {
						expires: cdk.Expiration.after(cdk.Duration.days(365)),
					},
				},
			},
		});

		const vpc = new ec2.Vpc(this, "SlsAppVPC");

		const cluster = new rds.ServerlessCluster(this, "SlsAppCluster", {
			engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
			defaultDatabaseName: "SlsAppDB",
			vpc,
			parameterGroup: rds.ParameterGroup.fromParameterGroupName(
				this,
				"ParameterGroup",
				"default.aurora-postgresql10"
			),
			scaling: {
				autoPause: cdk.Duration.seconds(0),
			},
		});

		const postFn = new lambda.Function(this, "SlsAppPostFunction", {
			runtime: lambda.Runtime.NODEJS_14_X,
			code: new lambda.AssetCode("lambda-resolvers"),
			handler: "index.handler",
			memorySize: 1024,
			environment: {
				CLUSTER_ARN: cluster.clusterArn,
				SECRET_ARN: cluster.secret?.secretArn || "",
				DB_NAME: "SlsAppDB",
				AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
			},
		});

		cluster.grantDataApiAccess(postFn);

		const lambdaDS = api.addLambdaDataSource("lambdaDataSource", postFn);
		lambdaDS.createResolver({
			typeName: "Query",
			fieldName: "listPosts",
		});
		lambdaDS.createResolver({
			typeName: "Query",
			fieldName: "getPostById",
		});
		lambdaDS.createResolver({
			typeName: "Mutation",
			fieldName: "createPost",
		});
		lambdaDS.createResolver({
			typeName: "Mutation",
			fieldName: "updatePost",
		});
		lambdaDS.createResolver({
			typeName: "Mutation",
			fieldName: "deletePost",
		});

		new cdk.CfnOutput(this, "AppSyncAPIURL", { value: api.graphqlUrl });
		new cdk.CfnOutput(this, "AppSyncAPIKey", { value: api.apiKey || "" });
		new cdk.CfnOutput(this, "ProjectRegion", { value: this.region });
	}
}
