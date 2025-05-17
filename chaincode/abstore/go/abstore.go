// 1. abstore.go (대출 기능만 남긴 최종 버전)

package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// LoanRequest 구조체
type LoanRequest struct {
	ID           string `json:"id"`
	Requester    string `json:"requester"`
	Amount       int    `json:"amount"`
	DurationDays int    `json:"durationDays"`
	Status       string `json:"status"`
	Provider     string `json:"provider"`
	StartTime    int64  `json:"startTime"`
}

// 체인코드 구조체
type LoanContract struct {
	contractapi.Contract
}

// 대출 요청 생성
func (t *LoanContract) CreateLoanRequest(ctx contractapi.TransactionContextInterface, id, requester string, amount, durationDays int) error {
	exists, err := t.LoanRequestExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("loan request %s already exists", id)
	}

	loan := LoanRequest{
		ID: id,
		Requester: requester,
		Amount: amount,
		DurationDays: durationDays,
		Status: "Pending",
		Provider: "",
		StartTime: 0,
	}

	loanJSON, err := json.Marshal(loan)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, loanJSON)
}

// 대출 요청 승인
func (t *LoanContract) ApproveLoanRequest(ctx contractapi.TransactionContextInterface, id, provider string) error {
	loanJSON, err := ctx.GetStub().GetState(id)
	if err != nil || loanJSON == nil {
		return fmt.Errorf("loan request %s does not exist", id)
	}

	var loan LoanRequest
	err = json.Unmarshal(loanJSON, &loan)
	if err != nil {
		return err
	}

	if loan.Status != "Pending" {
		return fmt.Errorf("loan request %s is not pending", id)
	}

	loan.Status = "Active"
	loan.Provider = provider
	loan.StartTime = time.Now().Unix()

	updatedLoanJSON, err := json.Marshal(loan)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, updatedLoanJSON)
}

// 대출 요청 삭제
func (t *LoanContract) DeleteLoanRequest(ctx contractapi.TransactionContextInterface, id string) error {
	exists, err := t.LoanRequestExists(ctx, id)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("loan request %s does not exist", id)
	}
	return ctx.GetStub().DelState(id)
}

// 대출 요청 수정
func (t *LoanContract) UpdateLoanRequest(ctx contractapi.TransactionContextInterface, id string, newAmount, newDurationDays int) error {
	loanJSON, err := ctx.GetStub().GetState(id)
	if err != nil || loanJSON == nil {
		return fmt.Errorf("loan request %s does not exist", id)
	}

	var loan LoanRequest
	err = json.Unmarshal(loanJSON, &loan)
	if err != nil {
		return err
	}

	if loan.Status != "Pending" {
		return fmt.Errorf("cannot update loan request %s because it is not pending", id)
	}

	loan.Amount = newAmount
	loan.DurationDays = newDurationDays

	updatedLoanJSON, err := json.Marshal(loan)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, updatedLoanJSON)
}

// 단일 대출 요청 조회
func (t *LoanContract) QueryLoanRequest(ctx contractapi.TransactionContextInterface, id string) (*LoanRequest, error) {
	loanJSON, err := ctx.GetStub().GetState(id)
	if err != nil || loanJSON == nil {
		return nil, fmt.Errorf("loan request %s does not exist", id)
	}

	var loan LoanRequest
	err = json.Unmarshal(loanJSON, &loan)
	if err != nil {
		return nil, err
	}

	return &loan, nil
}

// 전체 대출 요청 조회
func (t *LoanContract) QueryAllLoanRequests(ctx contractapi.TransactionContextInterface) ([]*LoanRequest, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var loans []*LoanRequest
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var loan LoanRequest
		err = json.Unmarshal(queryResponse.Value, &loan)
		if err == nil {
			loans = append(loans, &loan)
		}
	}
	return loans, nil
}

// 대출 요청 존재 여부
func (t *LoanContract) LoanRequestExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	loanJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, err
	}
	return loanJSON != nil, nil
}

func main() {
	cc, err := contractapi.NewChaincode(new(LoanContract))
	if err != nil {
		panic(err.Error())
	}

	if err := cc.Start(); err != nil {
		fmt.Printf("Error starting LoanContract chaincode: %s", err)
	}
}
