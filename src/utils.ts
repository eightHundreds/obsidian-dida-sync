import dayjs from "dayjs";
import { remark } from "remark";

export function addHeadingLevel(markdown: string) {
	const res = remark()
		.use(() => (tree) => {
			tree.children.forEach((node) => {
				if (node.type === "heading") {
					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					node.depth += 1;
				}
			});
		})
		.processSync(markdown)
		.toString();
	return res;
}

const format = (v: string) => {
	if (!v) {
		return "";
	}

	return dayjs(v).format("YYYY-MM-DD HH:mm:ss");
};

export const isFulfilled = <T>(
	input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";
