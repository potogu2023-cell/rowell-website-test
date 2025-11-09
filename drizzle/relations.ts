import { relations } from "drizzle-orm/relations";
import { users, aiConversations, aiMessages, apiKeys, llmCostTracking, products, productCategories, categories, resources, resourcePostTags, resourceTags } from "./schema";

export const aiConversationsRelations = relations(aiConversations, ({one, many}) => ({
	user: one(users, {
		fields: [aiConversations.userId],
		references: [users.id]
	}),
	aiMessages: many(aiMessages),
	llmCostTrackings: many(llmCostTracking),
}));

export const usersRelations = relations(users, ({many}) => ({
	aiConversations: many(aiConversations),
	apiKeys: many(apiKeys),
}));

export const aiMessagesRelations = relations(aiMessages, ({one}) => ({
	aiConversation: one(aiConversations, {
		fields: [aiMessages.conversationId],
		references: [aiConversations.id]
	}),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.createdBy],
		references: [users.id]
	}),
}));

export const llmCostTrackingRelations = relations(llmCostTracking, ({one}) => ({
	aiConversation: one(aiConversations, {
		fields: [llmCostTracking.conversationId],
		references: [aiConversations.id]
	}),
}));

export const productCategoriesRelations = relations(productCategories, ({one}) => ({
	product: one(products, {
		fields: [productCategories.productId],
		references: [products.id]
	}),
	category: one(categories, {
		fields: [productCategories.categoryId],
		references: [categories.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	productCategories: many(productCategories),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	productCategories: many(productCategories),
}));

export const resourcePostTagsRelations = relations(resourcePostTags, ({one}) => ({
	resource: one(resources, {
		fields: [resourcePostTags.postId],
		references: [resources.id]
	}),
	resourceTag: one(resourceTags, {
		fields: [resourcePostTags.tagId],
		references: [resourceTags.id]
	}),
}));

export const resourcesRelations = relations(resources, ({many}) => ({
	resourcePostTags: many(resourcePostTags),
}));

export const resourceTagsRelations = relations(resourceTags, ({many}) => ({
	resourcePostTags: many(resourcePostTags),
}));