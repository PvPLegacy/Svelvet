import { writable, derived } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { DataObject, Graph, Node } from '$lib/types';
import { createStore } from './createStore';
import type { Writable } from 'svelte/store';
import { cursorPositionRaw } from '$lib/stores/CursorStore';
import { calculateRelativeCursor } from './calculateRelativeCursor';

export function createGraph(id: string, initialZoom: number): Graph {
	const bounds = {
		top: writable(Infinity),
		left: writable(Infinity),
		right: writable(-Infinity),
		bottom: writable(-Infinity)
	};

	const translation = {
		x: writable(0),
		y: writable(0)
	};
	const dimensions = writable({} as DOMRect);

	const scale = writable(initialZoom);

	const graph: Graph = {
		id,
		nodes: createStore<Node>(),
		edges: writable(new Map()),
		transforms: {
			translation,
			scale,
			cursor: {
				x: writable(0),
				y: writable(0)
			}
		},
		dimensions,
		bounds,
		cursor: createDerivedCursorStore(cursorPositionRaw, dimensions, translation, scale),
		data: createStore<DataObject>(),
		isLocked: writable(false),
		connectingFrom: writable(null),
		groups: writable({
			selected: writable(new Set<Node>()),
			hidden: writable(new Set<Node>())
		})
	};

	return graph;
}

function createDerivedCursorStore(
	cursorPositionRaw: Readable<{ x: number; y: number }>,
	dimensions: Graph['dimensions'],
	translation: { x: Writable<number>; y: Writable<number> },
	scale: Writable<number>
): Readable<{ x: number; y: number }> {
	const cursorPosition: Readable<{ x: number; y: number }> = derived(
		[cursorPositionRaw, dimensions, translation.x, translation.y, scale],
		([$cursorPositionRaw, $dimensions, $translationX, $translationY, $scale]) => {
			const e = {
				clientX: $cursorPositionRaw.x,
				clientY: $cursorPositionRaw.y
			};

			return calculateRelativeCursor(
				e,
				$dimensions.top,
				$dimensions.left,
				$dimensions.width,
				$dimensions.height,
				$scale,
				$translationX,
				$translationY
			);
		}
	);

	return cursorPosition;
}
