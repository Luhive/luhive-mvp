import { QueryClient, dehydrate } from "@tanstack/react-query";

export async function dehydrateSeed(
	seed: (queryClient: QueryClient) => void | Promise<void>,
) {
	const queryClient = new QueryClient();
	await seed(queryClient);
	return dehydrate(queryClient);
}
