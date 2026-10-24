import { useCallback, useRef, useState } from "react";

type ObservableObjectAcceptable = object | { [key: string]: any };

export function useStatefulObject<T extends ObservableObjectAcceptable>(
	initialObject?: Partial<T>
) {
	const ref = useRef<Partial<T>>(initialObject ?? {});
	const [, setVersion] = useState<number>(0);

	const setObjectProperty = useCallback(
		<K extends keyof T>(field: K, value: T[K] | ((prev: T[K]) => T[K])) => {
			if (typeof value === "function") {
				const newValue = (value as (prev: T[K]) => T[K])(ref.current[field] as T[K]);
				ref.current[field] = newValue;
			} else {
				ref.current[field] = value;
			}
			setVersion((v) => v + 1);
		},
		[]
	);

	const setObject = useCallback((value: T | ((prev: T) => T)) => {
		const newValue =
			typeof value === "function" ? (value as (prev: T) => T)(ref.current as T) : value;
		ref.current = newValue;
		setVersion((v) => v + 1);
	}, []);

	return [ref.current as T, setObjectProperty, setObject] as const;
}

export function useStatefulArray<T>(initialArray?: T[]) {
	const ref = useRef<T[]>(initialArray ?? []);
	const [, setVersion] = useState<number>(0);

	const pushArrayItem = useCallback((value: T, index?: number) => {
		if (index !== undefined) {
			ref.current[index] = value;
		} else {
			ref.current.push(value);
		}
		setVersion((v) => v + 1);
	}, []);

	const setArray = useCallback((value: T[] | ((prev: T[]) => T[])) => {
		const newValue =
			typeof value === "function" ? (value as (prev: T[]) => T[])(ref.current) : value;
		ref.current = newValue;
		setVersion((v) => v + 1);
	}, []);

	return [ref.current, pushArrayItem, setArray] as const;
}
